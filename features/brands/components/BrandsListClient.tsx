'use client'

import {
  deleteBrand,
  importBrands,
  reorderBrands,
  setBrandFlags,
} from '@/features/brands/actions/brand.actions'
import { BrandCrudDrawer } from '@/features/brands/components/BrandCrudDrawer'
import type { BrandRow } from '@/features/brands/types'
import { MENU_MAX_FEATURED_BRANDS } from '@/features/categories/lib/menu-limits'
import { moveItem } from '@/features/categories/lib/tree-dnd'
import type { ImportField, ImportedRow } from '@/shared/components/admin/EntityImportDrawer'
import { EntityProductsDrawer } from '@/shared/components/admin/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Switch } from '@/shared/components/ui/Switch'
import { useEntityCrud } from '@/shared/hooks/admin/useEntityCrud'
import { useServerAction } from '@/shared/hooks/admin/useServerAction'
import { cls } from '@/shared/lib/admin/admin-classes'
import { slugify } from '@/shared/lib/slug'
import { cn } from '@/shared/lib/utils'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, FileSpreadsheet, GripVertical, Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

// xlsx (~300 KB) solo hace falta al abrir el import: carga diferida.
const EntityImportDrawer = dynamic(
  () => import('@/shared/components/admin/EntityImportDrawer').then((m) => m.EntityImportDrawer),
  { ssr: false },
)

const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Nombre', aliases: ['nombre', 'marca', 'brand'], required: true },
  { key: 'slug', label: 'Slug', aliases: [], mono: true },
  { key: 'tagline', label: 'Tagline', aliases: ['lema'] },
  { key: 'description', label: 'Descripcion', aliases: ['descripcion', 'descripción', 'desc'] },
  {
    key: 'imageUrl',
    label: 'URL Imagen',
    aliases: ['imagen', 'image', 'imagen url', 'image url', 'url imagen', 'logo'],
  },
]

function validateImportRow(data: ImportedRow): string[] {
  const errors: string[] = []
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug inválido (minúsculas, números y guiones)')
  }
  if (data.imageUrl) {
    try {
      new URL(data.imageUrl)
    } catch {
      errors.push('URL de imagen inválida')
    }
  }
  return errors
}

/** Columnas: marca · productos · visible · destacada · acciones. */
const GRID = 'grid grid-cols-[minmax(260px,1fr)_100px_80px_120px_96px] items-center'

type BrandFlag = 'isVisible' | 'featured'

interface Props {
  brands: BrandRow[]
}

export function BrandsListClient({ brands }: Props) {
  const [rows, setRows] = useState(brands)
  const [sourceRows, setSourceRows] = useState(brands)
  if (brands !== sourceRows) {
    setSourceRows(brands)
    setRows(brands)
  }

  const crud = useEntityCrud<BrandRow>(deleteBrand, (b) => `"${b.name}" enviada a la papelera`)
  const [showImport, setShowImport] = useState(false)
  const importer = useServerAction()
  const [, startTransition] = useTransition()
  const [pendingFlags, setPendingFlags] = useState<ReadonlySet<string>>(new Set())
  const [query, setQuery] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filtering = query.trim().length > 0
  const shown = useMemo(() => {
    if (!filtering) return rows
    const q = slugify(query)
    return rows.filter((b) => slugify(b.name).includes(q) || b.slug.includes(q))
  }, [rows, query, filtering])

  // Orden entre las destacadas: el menú toma las primeras N de la lista.
  const featuredRank = useMemo(() => {
    const rank = new Map<string, number>()
    rows.filter((b) => b.featured).forEach((b, i) => rank.set(b.id, i + 1))
    return rank
  }, [rows])
  const featuredCount = featuredRank.size
  const leftOut = rows.filter((b) => (featuredRank.get(b.id) ?? 0) > MENU_MAX_FEATURED_BRANDS)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = rows.findIndex((b) => b.id === active.id)
    const to = rows.findIndex((b) => b.id === over.id)
    if (from < 0 || to < 0) return

    const previous = rows
    const next = moveItem(rows, from, to).map((b, position) => ({ ...b, position }))
    setRows(next)
    startTransition(async () => {
      try {
        const result = await reorderBrands(next.map((b) => b.id))
        if (!result.success) {
          setRows(previous)
          toast.error(result.error)
        }
      } catch {
        setRows(previous)
        toast.error('No se pudo guardar el nuevo orden')
      }
    })
  }

  const handleFlag = (brand: BrandRow, flag: BrandFlag, value: boolean) => {
    const key = `${brand.id}:${flag}`
    const previous = rows
    setRows((list) => list.map((b) => (b.id === brand.id ? { ...b, [flag]: value } : b)))
    setPendingFlags((s) => new Set(s).add(key))
    startTransition(async () => {
      try {
        const result = await setBrandFlags({ id: brand.id, [flag]: value })
        if (!result.success) {
          setRows(previous)
          toast.error(result.error)
        }
      } catch {
        setRows(previous)
        toast.error('No se pudo guardar el cambio')
      } finally {
        setPendingFlags((s) => {
          const next = new Set(s)
          next.delete(key)
          return next
        })
      }
    })
  }

  const handleImport = (importRows: ImportedRow[]) => {
    importer.run(() => importBrands(importRows), {
      onSuccess: (data) => {
        toast.success(`${data.created} creadas, ${data.updated} actualizadas`)
        data.errors.forEach((e) => toast.error(e))
        setShowImport(false)
      },
      refresh: true,
    })
  }

  const nameOf = (id: UniqueIdentifier) => rows.find((b) => b.id === id)?.name ?? 'la marca'
  const positionOf = (id: UniqueIdentifier) => rows.findIndex((b) => b.id === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Moviendo ${nameOf(active.id)}, posición ${positionOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} irá a la posición ${positionOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} quedó en la posición ${positionOf(over.id)}.` : undefined,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su lugar.`,
  }

  return (
    <div className="px-4 sm:px-8 pt-7 pb-12">
      <PanelHeader
        label="Catálogo"
        title={`${rows.length} marca${rows.length !== 1 ? 's' : ''}`}
        align="center"
        side={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} className="mr-1.5" /> Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={crud.openNew}>
              <Plus size={15} className="mr-2" /> Nueva marca
            </Button>
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className={cls.panelTable}>
          <EmptyState
            icon={Tags}
            title="Todavía no hay marcas"
            description="Crea la primera marca para asignarla a tus productos."
            action={
              <Button variant="accent" size="sm" onClick={crud.openNew}>
                <Plus size={14} className="mr-1.5" /> Nueva marca
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <label className="relative flex-1 min-w-50 max-w-85">
              <span className="sr-only">Buscar marcas</span>
              <Search
                size={15}
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar marcas..."
                className={cn(cls.input, 'pl-9')}
              />
            </label>
            <span className="text-[12px] text-muted">
              {filtering
                ? 'Borra la búsqueda para reordenar.'
                : 'Arrastra desde el asa para cambiar el orden de la tienda.'}
            </span>
          </div>

          {featuredCount > MENU_MAX_FEATURED_BRANDS && (
            <div role="status" className="flex items-start gap-2.5 border border-(--bd) bg-card p-3 mb-3 text-[12px]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
              <span className="text-muted">
                <span className="text-text font-semibold">
                  Hay {featuredCount} marcas destacadas y el menú muestra {MENU_MAX_FEATURED_BRANDS}.
                </span>{' '}
                Quedan fuera {leftOut.map((b) => `«${b.name}»`).join(', ')}. Súbelas en la lista o
                quita «Destacada» a otras.
              </span>
            </div>
          )}

          <div className={cls.panelTable}>
            <div className="overflow-x-auto">
              <div className="min-w-170">
                <div className={cn(GRID, 'bg-surf border-b border-(--bd)')} aria-hidden>
                  <div className={cn(cls.th, 'border-b-0 pl-12')}>Marca</div>
                  <div className={cn(cls.th, 'border-b-0 px-3')}>Productos</div>
                  <div className={cn(cls.th, 'border-b-0 px-3')}>Visible</div>
                  <div className={cn(cls.th, 'border-b-0 px-3')}>Destacada</div>
                  <div className={cn(cls.th, 'border-b-0 px-3 text-right')}>Acciones</div>
                </div>

                {shown.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="Sin coincidencias"
                    description={`Ninguna marca coincide con «${query}».`}
                  />
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    accessibility={{
                      announcements,
                      screenReaderInstructions: {
                        draggable:
                          'Para mover una marca pulsa Espacio o Enter, usa las flechas arriba y abajo y vuelve a pulsar Espacio o Enter para soltar. Escape cancela.',
                      },
                    }}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={shown.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                      <ul aria-label="Marcas">
                        {shown.map((b) => (
                          <BrandRowItem
                            key={b.id}
                            brand={b}
                            featuredRank={featuredRank.get(b.id) ?? 0}
                            dndDisabled={filtering}
                            pendingFlags={pendingFlags}
                            onFlag={(flag, value) => handleFlag(b, flag, value)}
                            onEdit={() => crud.openEdit(b)}
                            onDelete={() => crud.openDelete(b)}
                            onViewProducts={() => crud.openViewing(b.id)}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Mover a la papelera?"
        description={`"${crud.pendingDelete?.name}" pasará a la papelera, desde donde puedes restaurarla o borrarla definitivamente (Configuración → Papelera).`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <BrandCrudDrawer brand={crud.editing} isNew={crud.isNew} onClose={crud.closeDrawer} />
      )}

      {showImport && (
        <EntityImportDrawer
          title="Importar marcas"
          entitySingular="marca"
          entityPlural="marcas"
          fields={IMPORT_FIELDS}
          validateRow={validateImportRow}
          templateHref="/plantillas/plantilla-importar-marcas.xlsx"
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {crud.viewingId && (
        <EntityProductsDrawer
          entityId={crud.viewingId}
          entityName={rows.find((b) => b.id === crud.viewingId)?.name ?? ''}
          entityType="brand"
          allBrands={rows.map((b) => ({ id: b.id, name: b.name }))}
          onClose={crud.closeViewing}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------

interface RowProps {
  brand: BrandRow
  /** Posición entre las destacadas (0 si no lo es). */
  featuredRank: number
  dndDisabled: boolean
  pendingFlags: ReadonlySet<string>
  onFlag: (flag: BrandFlag, value: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onViewProducts: () => void
}

function BrandRowItem({
  brand: b,
  featuredRank,
  dndDisabled,
  pendingFlags,
  onFlag,
  onEdit,
  onDelete,
  onViewProducts,
}: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: b.id, disabled: dndDisabled })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        GRID,
        'relative bg-card border-b border-(--bd) last:border-b-0',
        isDragging && 'z-1 bg-surf shadow-pop outline-1 outline-border-gold -outline-offset-1',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 pl-1.5 sm:pl-2.5 pr-3 py-2.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Mover ${b.name}`}
          disabled={dndDisabled}
          className={cn(
            'shrink-0 grid place-items-center size-7 bg-transparent border-none text-muted touch-none',
            dndDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab hover:text-text active:cursor-grabbing',
          )}
        >
          <GripVertical size={15} aria-hidden />
        </button>
        {b.imageUrl ? (
          <Image
            src={b.imageUrl}
            alt=""
            width={40}
            height={40}
            className={cn('size-10 object-cover shrink-0 border border-(--bd)', !b.isVisible && 'opacity-50')}
          />
        ) : (
          <div
            aria-hidden
            className="size-10 shrink-0 bg-surf border border-(--bd) grid place-items-center text-[11px] text-muted font-display font-black"
          >
            {b.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className={cn(cls.rowName, 'truncate', !b.isVisible && 'text-muted')}>{b.name}</div>
          <div className={cn(cls.rowSub, 'truncate normal-case tracking-normal')}>
            {b.slug}
            {b.tagline && <span> · {b.tagline}</span>}
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <button
          type="button"
          onClick={onViewProducts}
          className="bg-transparent border-none p-0 hover:text-accent-ink"
          aria-label={`Ver los ${b.productCount} productos de ${b.name}`}
        >
          <span className={cls.val}>{b.productCount}</span>
        </button>
      </div>

      <div className="px-3 py-2.5">
        <Switch
          checked={b.isVisible}
          onChange={(v) => onFlag('isVisible', v)}
          label={`Visible en la tienda: ${b.name}`}
          busy={pendingFlags.has(`${b.id}:isVisible`)}
        />
      </div>

      <div className="px-3 py-2.5 flex items-center gap-2">
        <Switch
          checked={b.featured}
          onChange={(v) => onFlag('featured', v)}
          label={`Destacada en el menú: ${b.name}`}
          busy={pendingFlags.has(`${b.id}:featured`)}
        />
        {featuredRank > MENU_MAX_FEATURED_BRANDS && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted leading-tight">
            <AlertTriangle size={12} className="text-warning shrink-0" aria-hidden />
            fuera del menú
          </span>
        )}
      </div>

      <div className="px-3 py-2.5 flex gap-1.5 justify-end">
        <Button variant="icon" size="sm" onClick={onEdit} title="Editar" aria-label={`Editar ${b.name}`}>
          <Pencil size={14} />
        </Button>
        <Button
          variant="icon"
          size="sm"
          destructive
          onClick={onDelete}
          title="Mover a la papelera"
          aria-label={`Mover ${b.name} a la papelera`}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </li>
  )
}
