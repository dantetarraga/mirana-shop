'use client'

import type { AdminCategoryRow } from '@/features/categories/types'
import { Button } from '@/shared/components/ui/Button'
import { Switch } from '@/shared/components/ui/Switch'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

/** Sangría por nivel (px). La misma que usa la proyección del arrastre. */
export const TREE_INDENT = 28

/** Columnas del árbol: nombre · productos · visible · en menú · acciones. */
export const TREE_GRID =
  'grid grid-cols-[minmax(280px,1fr)_150px_80px_80px_128px] items-center'

export type CategoryFlag = 'isVisible' | 'showInMenu'

interface Props {
  row: AdminCategoryRow
  /** 0 raíz, 1 subcategoría. Mientras se arrastra, el nivel proyectado. */
  depth: number
  hasChildren: boolean
  isLastChild: boolean
  expanded: boolean
  /** Productos de sus subcategorías (no incluye los propios). */
  descendantProducts: number
  /** Oculta porque su padre está oculto. */
  hiddenByParent: string | null
  /** Es la fila que se está arrastrando: se pinta como hueco en su destino. */
  ghost?: boolean
  dndDisabled: boolean
  pendingFlags: ReadonlySet<string>
  onToggleExpanded: () => void
  onFlag: (flag: CategoryFlag, value: boolean) => void
  onAddChild: () => void
  onEdit: () => void
  onDelete: () => void
  onViewProducts: () => void
}

export function CategoryTreeRow({
  row,
  depth,
  hasChildren,
  isLastChild,
  expanded,
  descendantProducts,
  hiddenByParent,
  ghost = false,
  dndDisabled,
  pendingFlags,
  onToggleExpanded,
  onFlag,
  onAddChild,
  onEdit,
  onDelete,
  onViewProducts,
}: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({ id: row.id, disabled: dndDisabled })

  const isRoot = depth === 0
  const hiddenInStore = !row.isVisible || !!hiddenByParent

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        TREE_GRID,
        'relative bg-card border-b border-(--bd) last:border-b-0',
        ghost && 'z-1 bg-surf outline-1 outline-dashed outline-border-gold -outline-offset-1',
      )}
    >
      {/* Nombre: asa · sangría con línea guía · chevron · miniatura · texto */}
      <div className="flex items-center gap-2 min-w-0 pl-1.5 sm:pl-2.5 pr-3 py-2.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Mover ${row.name}`}
          disabled={dndDisabled}
          className={cn(
            'shrink-0 grid place-items-center size-7 bg-transparent border-none text-muted touch-none',
            dndDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab hover:text-text active:cursor-grabbing',
          )}
        >
          <GripVertical size={15} aria-hidden />
        </button>

        {depth > 0 && (
          <span aria-hidden className="relative shrink-0 self-stretch -my-2.5" style={{ width: TREE_INDENT * depth }}>
            {/* Vertical: del padre hacia abajo; en la última hija termina en el centro. */}
            <span
              className={cn('absolute left-3 top-0 w-px bg-field/50', isLastChild ? 'h-1/2' : 'bottom-0')}
            />
            <span className="absolute left-3 top-1/2 h-px w-4 bg-field/50" />
          </span>
        )}

        {isRoot && hasChildren ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${row.name}`}
            className="shrink-0 grid place-items-center size-6 bg-transparent border-none text-muted hover:text-text"
          >
            <ChevronRight
              size={15}
              aria-hidden
              className={cn('transition-transform duration-150 motion-reduce:transition-none', expanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span aria-hidden className="shrink-0 size-6" />
        )}

        {row.imageUrl ? (
          <Image
            src={row.imageUrl}
            alt=""
            width={32}
            height={32}
            className={cn('size-8 object-cover shrink-0 border border-(--bd)', hiddenInStore && 'opacity-50')}
          />
        ) : (
          <div
            aria-hidden
            className="size-8 shrink-0 bg-surf border border-(--bd) grid place-items-center text-[10px] text-muted font-display font-black"
          >
            {row.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className={cn(cls.rowName, 'truncate', hiddenInStore && 'text-muted')}>{row.name}</div>
          <div className={cn(cls.rowSub, 'truncate normal-case tracking-normal')}>
            {row.slug}
            {hiddenByParent && <span> · oculta por «{hiddenByParent}»</span>}
          </div>
        </div>
      </div>

      {/* Productos: directos / en subcategorías */}
      <div className="px-3 py-2.5">
        <button
          type="button"
          onClick={onViewProducts}
          className="text-left bg-transparent border-none p-0 hover:text-accent-ink"
          aria-label={`Ver productos de ${row.name}: ${row.productCount} directos${descendantProducts ? `, ${descendantProducts} en subcategorías` : ''}`}
        >
          <span className={cls.val}>{row.productCount}</span>
          {descendantProducts > 0 && (
            <span className="block text-[11px] text-muted leading-tight">
              +{descendantProducts} en subcategorías
            </span>
          )}
        </button>
      </div>

      <div className="px-3 py-2.5">
        <Switch
          checked={row.isVisible}
          onChange={(v) => onFlag('isVisible', v)}
          label={`Visible en la tienda: ${row.name}`}
          busy={pendingFlags.has(`${row.id}:isVisible`)}
        />
      </div>

      <div className="px-3 py-2.5">
        {isRoot ? (
          <Switch
            checked={row.showInMenu}
            onChange={(v) => onFlag('showInMenu', v)}
            label={`En el menú: ${row.name}`}
            busy={pendingFlags.has(`${row.id}:showInMenu`)}
          />
        ) : (
          <span className="text-muted text-[13px]" aria-label="No aplica a subcategorías">
            —
          </span>
        )}
      </div>

      <div className="px-3 py-2.5 flex gap-1.5 justify-end">
        {isRoot && (
          <Button variant="icon" size="sm" onClick={onAddChild} title="Añadir subcategoría" aria-label={`Añadir subcategoría a ${row.name}`}>
            <Plus size={14} />
          </Button>
        )}
        <Button variant="icon" size="sm" onClick={onEdit} title="Editar" aria-label={`Editar ${row.name}`}>
          <Pencil size={14} />
        </Button>
        <Button
          variant="icon"
          size="sm"
          destructive
          onClick={onDelete}
          title="Mover a la papelera"
          aria-label={`Mover ${row.name} a la papelera`}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </li>
  )
}
