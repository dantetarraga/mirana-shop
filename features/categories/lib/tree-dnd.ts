import { buildTree, compareSiblings, flattenTree } from '@/features/categories/lib/category-tree'
import { MAX_CATEGORY_DEPTH } from '@/features/categories/lib/menu-limits'
import type { CategoryMove } from '@/features/categories/types'

// ---------------------------------------------------------------------------
// Lógica pura del arrastrar y soltar del árbol del admin (sin React ni
// dnd-kit, para poder testearla).
//
// El árbol se pinta como una lista plana en preorden; arrastrar en vertical
// cambia el orden y arrastrar en horizontal (o ←/→ con teclado) cambia el
// nivel. La "proyección" calcula, para la posición actual del puntero, dónde
// caería la categoría: nivel y padre. Solo se mueve la categoría arrastrada:
// sus vecinas nunca cambian de padre.
// ---------------------------------------------------------------------------

export interface DndRow {
  id: string
  parentId: string | null
  position: number
  name: string
}

export interface FlatRow<T extends DndRow = DndRow> {
  row: T
  /** 0 = raíz, 1 = subcategoría. */
  depth: number
  hasChildren: boolean
}

/**
 * Filas visibles en orden de pintado. Se ocultan las hijas de las raíces
 * contraídas y, mientras se arrastra, las de la categoría arrastrada (viajan
 * con ella).
 */
export function flattenVisible<T extends DndRow>(
  rows: readonly T[],
  collapsed: ReadonlySet<string>,
  activeId?: string | null,
): FlatRow<T>[] {
  const out: FlatRow<T>[] = []
  for (const node of flattenTree(buildTree(rows))) {
    const parentId = node.parentId
    if (parentId && (collapsed.has(parentId) || parentId === activeId)) continue
    const { depth, children, ...row } = node
    out.push({ row: row as unknown as T, depth: depth - 1, hasChildren: children.length > 0 })
  }
  return out
}

/** arrayMove sin depender de @dnd-kit/sortable. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export interface Projection {
  depth: number
  parentId: string | null
}

/**
 * Dónde caería `activeId` si se suelta sobre `overId` con un desplazamiento
 * horizontal `offsetX` (px). `indent` = px por nivel.
 */
export function getProjection(
  items: readonly FlatRow[],
  activeId: string,
  overId: string,
  offsetX: number,
  indent: number,
  maxDepth = MAX_CATEGORY_DEPTH,
): Projection | null {
  const activeIndex = items.findIndex((i) => i.row.id === activeId)
  const overIndex = items.findIndex((i) => i.row.id === overId)
  if (activeIndex < 0 || overIndex < 0) return null

  const active = items[activeIndex]
  const moved = moveItem(items, activeIndex, overIndex)
  const prev = moved[overIndex - 1]

  // Una categoría con hijas tiene que seguir siendo raíz (máx. 2 niveles).
  const max = active.hasChildren || !prev ? 0 : Math.min(prev.depth + 1, maxDepth - 1)
  const projected = active.depth + Math.round(offsetX / indent)
  const depth = Math.max(0, Math.min(projected, max))

  if (depth === 0 || !prev) return { depth: 0, parentId: null }
  return { depth, parentId: prev.depth === 0 ? prev.row.id : prev.row.parentId }
}

/**
 * Movimientos para reorderCategories: nuevo padre de la arrastrada y posición
 * de todas las hermanas afectadas (las del padre nuevo y las del viejo). Solo
 * se devuelven las filas que cambian.
 *
 * `visibleOrder` es el orden de la lista visible DESPUÉS de soltar. Si el
 * padre nuevo está contraído, la categoría va al final de sus hijas.
 */
export function computeMoves(
  rows: readonly DndRow[],
  visibleOrder: readonly string[],
  activeId: string,
  newParentId: string | null,
  collapsed: ReadonlySet<string> = new Set(),
): CategoryMove[] {
  const active = rows.find((r) => r.id === activeId)
  if (!active) return []
  const oldParentId = active.parentId

  const parentOf = (r: DndRow) => (r.id === activeId ? newParentId : r.parentId)
  const sorted = [...rows].sort(compareSiblings)

  let newSiblings: string[]
  if (newParentId && collapsed.has(newParentId)) {
    newSiblings = [
      ...sorted.filter((r) => r.parentId === newParentId && r.id !== activeId).map((r) => r.id),
      activeId,
    ]
  } else {
    const order = new Map(visibleOrder.map((id, i) => [id, i]))
    newSiblings = rows
      .filter((r) => parentOf(r) === newParentId)
      .sort(
        (a, b) =>
          (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) || compareSiblings(a, b),
      )
      .map((r) => r.id)
  }

  const target = new Map<string, CategoryMove>()
  newSiblings.forEach((id, position) => target.set(id, { id, parentId: newParentId, position }))

  if (oldParentId !== newParentId) {
    sorted
      .filter((r) => r.parentId === oldParentId && r.id !== activeId)
      .forEach((r, position) => target.set(r.id, { id: r.id, parentId: oldParentId, position }))
  }

  const byId = new Map(rows.map((r) => [r.id, r]))
  return [...target.values()].filter((m) => {
    const r = byId.get(m.id)!
    return r.parentId !== m.parentId || r.position !== m.position
  })
}

/** Aplica los movimientos sobre las filas (UI optimista). */
export function applyCategoryMoves<T extends DndRow>(rows: readonly T[], moves: readonly CategoryMove[]): T[] {
  const byId = new Map(moves.map((m) => [m.id, m]))
  return rows.map((r) => {
    const m = byId.get(r.id)
    return m ? { ...r, parentId: m.parentId, position: m.position } : r
  })
}
