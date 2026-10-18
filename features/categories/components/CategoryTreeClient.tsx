'use client'

import {
  deleteCategory,
  importCategories,
  reorderCategories,
  setCategoryFlags,
} from '@/features/categories/actions/category.actions'
import { CategoryCrudDrawer } from '@/features/categories/components/CategoryCrudDrawer'
import {
  CategoryTreeRow,
  TREE_GRID,
  TREE_INDENT,
  type CategoryFlag,
} from '@/features/categories/components/CategoryTreeRow'
import { MenuPreviewPanel } from '@/features/categories/components/MenuPreviewPanel'
import { ancestorsOf, totalsWithDescendants } from '@/features/categories/lib/category-tree'
import {
  applyCategoryMoves,
  computeMoves,
  flattenVisible,
  getProjection,
  moveItem,
  type Projection,
} from '@/features/categories/lib/tree-dnd'
import type { AdminCategoryRow } from '@/features/categories/types'
import type { ImportField, ImportedRow } from '@/shared/components/admin/EntityImportDrawer'
import { EntityProductsDrawer } from '@/shared/components/admin/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useEntityCrud } from '@/shared/hooks/admin/useEntityCrud'
import { useServerAction } from '@/shared/hooks/admin/useServerAction'
import { cls } from '@/shared/lib/admin/admin-classes'
import { slugify } from '@/shared/lib/slug'
import { cn } from '@/shared/lib/utils'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FileSpreadsheet, FolderTree, GripVertical, Plus, Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

// xlsx (~300 KB) solo hace falta al abrir el import: carga diferida.
const EntityImportDrawer = dynamic(
  () => import('@/shared/components/admin/EntityImportDrawer').then((m) => m.EntityImportDrawer),
  { ssr: false },
)

const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Nombre', aliases: ['nombre', 'categoria', 'categoría', 'category'], required: true },
  { key: 'slug', label: 'Slug', aliases: [], mono: true },
  { key: 'parent', label: 'Padre', aliases: ['padre', 'categoria padre', 'categoría padre'] },
  { key: 'description', label: 'Descripcion', aliases: ['descripcion', 'descripción', 'desc'] },
  {
    key: 'imageUrl',
    label: 'URL Imagen',
    aliases: ['imagen', 'image', 'imagen url', 'image url', 'url imagen'],
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

/**
 * Teclado: ↑/↓ cambian el orden (dnd-kit) y →/← el nivel, desplazando la
 * proyección una sangría. Así el árbol se reordena sin ratón.
 */
const treeKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const { currentCoordinates } = args
  if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
    event.preventDefault()
    return {
      ...currentCoordinates,
      x: currentCoordinates.x + (event.code === 'ArrowRight' ? TREE_INDENT : -TREE_INDENT),
    }
  }
  return sortableKeyboardCoordinates(event, args)
}

const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } }

interface Props {
  categories: AdminCategoryRow[]
}

export function CategoryTreeClient({ categories }: Props) {
  // Copia local para la UI optimista; se resincroniza cuando el servidor
  // manda datos nuevos (router.refresh tras crear/editar/borrar).
  const [rows, setRows] = useState(categories)
  const [sourceRows, setSourceRows] = useState(categories)
  if (categories !== sourceRows) {
    setSourceRows(categories)
    setRows(categories)
  }

  const crud = useEntityCrud<AdminCategoryRow>(deleteCategory, (c) => `"${c.name}" enviada a la papelera`)
  const [newParentId, setNewParentId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const importer = useServerAction()
  const [, startTransition] = useTransition()
  const [pendingFlags, setPendingFlags] = useState<ReadonlySet<string>>(new Set())

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: treeKeyboardCoordinates }),
  )

  // ── Derivados ─────────────────────────────────────────────────────────────
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])
  const totals = useMemo(() => totalsWithDescendants(rows, (r) => r.productCount), [rows])

  const filtering = query.trim().length > 0
  const visibleRows = useMemo(() => {
    if (!filtering) return rows
    const q = slugify(query)
    const keep = new Set<string>()
    for (const r of rows) {
      if (slugify(r.name).includes(q) || r.slug.includes(q)) {
        keep.add(r.id)
        for (const a of ancestorsOf(rows, r.id)) keep.add(a.id)
      }
    }
    return rows.filter((r) => keep.has(r.id))
  }, [rows, query, filtering])

  const flat = useMemo(
    () => flattenVisible(visibleRows, filtering ? new Set() : collapsed, activeId),
    [visibleRows, filtering, collapsed, activeId],
  )

  const projection: Projection | null =
    activeId && overId ? getProjection(flat, activeId, overId, offsetX, TREE_INDENT) : null

  const rootCount = rows.filter((r) => !r.parentId).length
  const dndDisabled = filtering

  // ── Arrastre ──────────────────────────────────────────────────────────────
  const resetDrag = () => {
    setActiveId(null)
    setOverId(null)
    setOffsetX(0)
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setOverId(String(active.id))
  }

  const handleDragMove = ({ delta }: DragMoveEvent) => setOffsetX(delta.x)

  const handleDragOver = ({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const drop = projection
    resetDrag()
    if (!over || !drop) return

    const id = String(active.id)
    const from = flat.findIndex((i) => i.row.id === id)
    const to = flat.findIndex((i) => i.row.id === String(over.id))
    if (from < 0 || to < 0) return

    const order = moveItem(flat, from, to).map((i) => i.row.id)
    const moves = computeMoves(rows, order, id, drop.parentId, collapsed)
    if (moves.length === 0) return

    const previous = rows
    setRows(
      applyCategoryMoves(rows, moves).map((r) =>
        r.id === id && drop.parentId ? { ...r, showInMenu: false } : r,
      ),
    )
    startTransition(async () => {
      try {
        const result = await reorderCategories(moves)
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

  // ── Switches inline (optimistas) ──────────────────────────────────────────
  const handleFlag = (row: AdminCategoryRow, flag: CategoryFlag, value: boolean) => {
    const key = `${row.id}:${flag}`
    const previous = rows
    setRows((list) => list.map((r) => (r.id === row.id ? { ...r, [flag]: value } : r)))
    setPendingFlags((s) => new Set(s).add(key))
    startTransition(async () => {
      try {
        const result = await setCategoryFlags({ id: row.id, [flag]: value })
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

  const toggleCollapsed = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleImport = (importRows: ImportedRow[]) => {
    importer.run(() => importCategories(importRows), {
      onSuccess: (data) => {
        toast.success(`${data.created} creadas, ${data.updated} actualizadas`)
        data.errors.forEach((e) => toast.error(e))
        setShowImport(false)
      },
      refresh: true,
    })
  }

  const openNew = (parentId: string | null) => {
    setNewParentId(parentId)
    crud.openNew()
  }

  // ── Lector de pantalla ────────────────────────────────────────────────────
  const nameOf = (id: UniqueIdentifier) => byId.get(String(id))?.name ?? 'la categoría'
  const describe = (p: Projection | null) =>
    !p || !p.parentId ? 'como categoría principal' : `dentro de ${nameOf(p.parentId)}`

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Moviendo ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} irá ${describe(projection)}, cerca de ${nameOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} se soltó ${describe(projection)}.` : `${nameOf(active.id)} vuelve a su lugar.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. ${nameOf(active.id)} vuelve a su lugar.`,
  }

  const activeRow = activeId ? byId.get(activeId) : null
  const activeChildren = activeId ? rows.filter((r) => r.parentId === activeId).length : 0

  const allLabels = useMemo(
    () =>
      rows.map((c) => {
        const parent = c.parentId ? byId.get(c.parentId) : null
        return { id: c.id, name: parent ? `${parent.name} › ${c.name}` : c.name }
      }),
    [rows, byId],
  )

  return (
    <div className="px-4 sm:px-8 pt-7 pb-12">
      <PanelHeader
        label="Catálogo"
        title={`${rows.length} categoría${rows.length !== 1 ? 's' : ''}`}
        align="center"
        side={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} className="mr-1.5" /> Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={() => openNew(null)}>
              <Plus size={15} className="mr-2" /> Nueva categoría
            </Button>
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className={cls.panelTable}>
          <EmptyState
            icon={FolderTree}
            title="Todavía no hay categorías"
            description="Crea la primera categoría principal; después podrás añadirle subcategorías."
            action={
              <Button variant="accent" size="sm" onClick={() => openNew(null)}>
                <Plus size={14} className="mr-1.5" /> Nueva categoría
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
          <section aria-label="Árbol de categorías" className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <label className="relative flex-1 min-w-50 max-w-85">
                <span className="sr-only">Buscar categorías</span>
                <Search
                  size={15}
                  aria-hidden
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar categorías..."
                  className={cn(cls.input, 'pl-9')}
                />
              </label>
              <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set())} disabled={filtering}>
                Expandir todo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={filtering}
                onClick={() => setCollapsed(new Set(rows.filter((r) => !r.parentId).map((r) => r.id)))}
              >
                Contraer todo
              </Button>
            </div>

            <p className="text-[12px] text-muted mb-3">
              {filtering
                ? 'Borra la búsqueda para reordenar.'
                : 'Arrastra desde el asa para ordenar; hacia la derecha la conviertes en subcategoría de la de arriba. Con teclado: Espacio para tomar, ↑ ↓ para mover, → ← para cambiar de nivel.'}
            </p>

            <div className={cls.panelTable}>
              <div className="overflow-x-auto">
                <div className="min-w-180">
                  <div className={cn(TREE_GRID, 'bg-surf border-b border-(--bd)')} aria-hidden>
                    <div className={cn(cls.th, 'border-b-0 pl-11')}>Categoría</div>
                    <div className={cn(cls.th, 'border-b-0 px-3')}>Productos</div>
                    <div className={cn(cls.th, 'border-b-0 px-3')}>Visible</div>
                    <div className={cn(cls.th, 'border-b-0 px-3')}>En menú</div>
                    <div className={cn(cls.th, 'border-b-0 px-3 text-right')}>Acciones</div>
                  </div>

                  {flat.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="Sin coincidencias"
                      description={`Ninguna categoría coincide con «${query}».`}
                    />
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      measuring={MEASURING}
                      accessibility={{
                        announcements,
                        screenReaderInstructions: {
                          draggable:
                            'Para mover una categoría pulsa Espacio o Enter. Flechas arriba y abajo cambian el orden; derecha la mete en la categoría de arriba y izquierda la vuelve principal. Espacio o Enter para soltar, Escape para cancelar.',
                        },
                      }}
                      onDragStart={handleDragStart}
                      onDragMove={handleDragMove}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDragCancel={resetDrag}
                    >
                      <SortableContext
                        items={flat.map((i) => i.row.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul aria-label="Categorías">
                          {flat.map((item, index) => {
                            const { row } = item
                            const isActive = row.id === activeId
                            const depth = isActive && projection ? projection.depth : item.depth
                            const next = flat[index + 1]
                            const parent = row.parentId ? byId.get(row.parentId) : null
                            return (
                              <CategoryTreeRow
                                key={row.id}
                                row={row}
                                depth={depth}
                                hasChildren={item.hasChildren}
                                isLastChild={depth > 0 && (!next || next.depth === 0)}
                                expanded={filtering || !collapsed.has(row.id)}
                                descendantProducts={(totals.get(row.id) ?? 0) - row.productCount}
                                hiddenByParent={parent && !parent.isVisible ? parent.name : null}
                                ghost={isActive}
                                dndDisabled={dndDisabled}
                                pendingFlags={pendingFlags}
                                onToggleExpanded={() => toggleCollapsed(row.id)}
                                onFlag={(flag, value) => handleFlag(row, flag, value)}
                                onAddChild={() => openNew(row.id)}
                                onEdit={() => crud.openEdit(row)}
                                onDelete={() => crud.openDelete(row)}
                                onViewProducts={() => crud.openViewing(row.id)}
                              />
                            )
                          })}
                        </ul>
                      </SortableContext>

                      <DragOverlay dropAnimation={null}>
                        {activeRow && (
                          <div className="inline-flex items-center gap-2.5 bg-surf border border-border-gold shadow-pop px-3 py-2">
                            <GripVertical size={15} className="text-muted" aria-hidden />
                            <span className={cls.rowName}>{activeRow.name}</span>
                            {activeChildren > 0 && (
                              <span className="text-[11px] text-muted">
                                +{activeChildren} subcategoría{activeChildren !== 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="text-[11px] text-accent-ink">{describe(projection)}</span>
                          </div>
                        )}
                      </DragOverlay>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[12px] text-muted mt-3">
              {rootCount} principal{rootCount !== 1 ? 'es' : ''} · {rows.length - rootCount}{' '}
              subcategoría{rows.length - rootCount !== 1 ? 's' : ''}. Los conteos incluyen productos
              en cualquier estado; la vista previa usa solo los visibles en la tienda.
            </p>
          </section>

          <MenuPreviewPanel rows={rows} />
        </div>
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
        <CategoryCrudDrawer
          category={crud.editing}
          isNew={crud.isNew}
          allCategories={rows}
          defaultParentId={crud.isNew ? newParentId : null}
          onClose={crud.closeDrawer}
        />
      )}

      {showImport && (
        <EntityImportDrawer
          title="Importar categorías"
          entitySingular="categoría"
          entityPlural="categorías"
          fields={IMPORT_FIELDS}
          validateRow={validateImportRow}
          templateHref="/plantillas/plantilla-importar-categorias.xlsx"
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {crud.viewingId && (
        <EntityProductsDrawer
          entityId={crud.viewingId}
          entityName={byId.get(crud.viewingId)?.name ?? ''}
          entityType="category"
          allCategories={allLabels}
          onClose={crud.closeViewing}
        />
      )}
    </div>
  )
}
