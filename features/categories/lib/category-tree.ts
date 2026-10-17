import { MAX_CATEGORY_DEPTH } from '@/features/categories/lib/menu-limits'

// ---------------------------------------------------------------------------
// Árbol de categorías — funciones puras (sin BD) que comparten las actions,
// las queries de la tienda y el árbol del admin.
//
// Todas reciben la lista plana de categorías VIVAS (`deletedAt: null`): un
// padre que no está en la lista se considera inexistente o en la papelera.
// Todas toleran datos corruptos (ciclos, padres huérfanos) sin colgarse: es
// lo que permite usarlas para DETECTAR esos casos.
// ---------------------------------------------------------------------------

export interface TreeItem {
  id: string
  parentId: string | null
  position?: number
  name?: string
}

export type TreeNode<T extends TreeItem> = T & {
  /** 1 = raíz, 2 = subcategoría. */
  depth: number
  children: TreeNode<T>[]
}

export class CategoryTreeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CategoryTreeError'
  }
}

/** Orden entre hermanas: position, luego nombre (es-PE), luego id para empates. */
export function compareSiblings(a: TreeItem, b: TreeItem): number {
  return (
    (a.position ?? 0) - (b.position ?? 0) ||
    (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' }) ||
    a.id.localeCompare(b.id)
  )
}

function indexById<T extends TreeItem>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]))
}

function childrenIndex<T extends TreeItem>(items: readonly T[]): Map<string | null, T[]> {
  const byId = indexById(items)
  const index = new Map<string | null, T[]>()
  for (const item of items) {
    // Un padre que no está en la lista (borrado o inexistente) cuelga a la
    // hija de la raíz: así no desaparece del árbol del admin.
    const key = item.parentId && byId.has(item.parentId) ? item.parentId : null
    const list = index.get(key)
    if (list) list.push(item)
    else index.set(key, [item])
  }
  for (const list of index.values()) list.sort(compareSiblings)
  return index
}

/** Hijas directas de `parentId` (null = raíces), ordenadas. */
export function childrenOf<T extends TreeItem>(items: readonly T[], parentId: string | null): T[] {
  return childrenIndex(items).get(parentId) ?? []
}

/**
 * Lista plana → árbol ordenado. Los nodos atrapados en un ciclo (inalcanzables
 * desde una raíz) se agregan como raíces para no perderlos.
 */
export function buildTree<T extends TreeItem>(items: readonly T[]): TreeNode<T>[] {
  const index = childrenIndex(items)
  const visited = new Set<string>()

  const build = (item: T, depth: number): TreeNode<T> => {
    visited.add(item.id)
    const children = (index.get(item.id) ?? [])
      .filter((c) => !visited.has(c.id))
      .map((c) => build(c, depth + 1))
    return { ...item, depth, children }
  }

  const roots = (index.get(null) ?? []).map((r) => build(r, 1))
  for (const item of [...items].sort(compareSiblings)) {
    if (!visited.has(item.id)) roots.push(build(item, 1))
  }
  return roots
}

/** Recorrido en preorden (padre, hijas…) — el orden en que se pinta el árbol. */
export function flattenTree<T extends TreeItem>(nodes: readonly TreeNode<T>[]): TreeNode<T>[] {
  const out: TreeNode<T>[] = []
  const walk = (list: readonly TreeNode<T>[]) => {
    for (const n of list) {
      out.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return out
}

/**
 * Lista plana ordenada en preorden, sin `depth`/`children`: la misma forma
 * que entró, en el orden en que se pinta el árbol.
 */
export function sortAsTree<T extends TreeItem>(items: readonly T[]): T[] {
  const byId = indexById(items)
  return flattenTree(buildTree(items)).map((n) => byId.get(n.id)!)
}

/** IDs de todas las descendientes de `id` (sin incluirla). */
export function descendantsOf(items: readonly TreeItem[], id: string): string[] {
  const index = childrenIndex(items)
  const out: string[] = []
  const seen = new Set<string>([id])
  const queue = [id]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const child of index.get(current) ?? []) {
      if (seen.has(child.id)) continue
      seen.add(child.id)
      out.push(child.id)
      queue.push(child.id)
    }
  }
  return out
}

/** Ancestros de `id`, de la raíz hacia abajo (sin incluirla). Corta si hay ciclo. */
export function ancestorsOf<T extends TreeItem>(items: readonly T[], id: string): T[] {
  const byId = indexById(items)
  const out: T[] = []
  const seen = new Set<string>([id])
  let parentId = byId.get(id)?.parentId ?? null
  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId)
    if (!parent) break
    seen.add(parentId)
    out.unshift(parent)
    parentId = parent.parentId
  }
  return out
}

/** Nivel de la categoría: 1 raíz, 2 subcategoría… */
export function depthOf(items: readonly TreeItem[], id: string): number {
  return ancestorsOf(items, id).length + 1
}

/** Niveles que ocupa el subárbol de `id`: 1 si no tiene hijas. */
export function subtreeHeight(items: readonly TreeItem[], id: string): number {
  const index = childrenIndex(items)
  const seen = new Set<string>()
  const height = (current: string): number => {
    seen.add(current)
    let max = 0
    for (const child of index.get(current) ?? []) {
      if (!seen.has(child.id)) max = Math.max(max, height(child.id))
    }
    return max + 1
  }
  return height(id)
}

/** ¿Colgar `id` de `parentId` cerraría un ciclo? */
export function wouldCreateCycle(
  items: readonly TreeItem[],
  id: string,
  parentId: string | null,
): boolean {
  if (!parentId) return false
  if (parentId === id) return true
  return descendantsOf(items, id).includes(parentId)
}

/** Lanza CategoryTreeError si colgar `id` de `parentId` cerraría un ciclo. */
export function assertNoCycle(items: readonly TreeItem[], id: string, parentId: string | null): void {
  if (wouldCreateCycle(items, id, parentId)) {
    throw new CategoryTreeError(
      parentId === id
        ? 'Una categoría no puede ser su propia subcategoría'
        : 'No puedes mover una categoría dentro de una de sus propias subcategorías',
    )
  }
}

/**
 * Motivo por el que `id` (null = categoría nueva) no puede colgar de
 * `parentId`, o null si puede. Revisa existencia del padre, ciclos y la
 * profundidad máxima (MAX_CATEGORY_DEPTH).
 */
export function findParentError(
  items: readonly TreeItem[],
  id: string | null,
  parentId: string | null,
  maxDepth = MAX_CATEGORY_DEPTH,
): string | null {
  if (!parentId) return null

  const byId = indexById(items)
  const parent = byId.get(parentId)
  if (!parent) return 'La categoría padre no existe o está en la papelera'

  if (id) {
    try {
      assertNoCycle(items, id, parentId)
    } catch (err) {
      return (err as Error).message
    }
  }

  const parentDepth = depthOf(items, parentId)
  const ownHeight = id && byId.has(id) ? subtreeHeight(items, id) : 1
  if (parentDepth + ownHeight > maxDepth) {
    if (parentDepth >= maxDepth) {
      return `"${parent.name ?? 'La categoría padre'}" ya es una subcategoría: solo se permiten ${maxDepth} niveles`
    }
    const self = id ? byId.get(id) : undefined
    return `"${self?.name ?? 'La categoría'}" tiene subcategorías: debe seguir siendo una categoría principal`
  }

  return null
}

/**
 * Valida el árbol completo: padres existentes, sin ciclos y profundidad máxima.
 * Devuelve el primer problema o null. Se usa tras aplicar un reordenamiento.
 */
export function validateTree(
  items: readonly TreeItem[],
  maxDepth = MAX_CATEGORY_DEPTH,
): string | null {
  const byId = indexById(items)
  for (const item of items) {
    if (!item.parentId) continue
    if (item.parentId === item.id) return `"${item.name ?? item.id}" no puede ser su propio padre`
    if (!byId.has(item.parentId)) {
      return `El padre de "${item.name ?? item.id}" no existe o está en la papelera`
    }

    // Camino hacia la raíz: si se repite un nodo, hay ciclo.
    const seen = new Set<string>([item.id])
    let depth = 1
    let current: string | null = item.parentId
    while (current) {
      if (seen.has(current)) {
        return `"${item.name ?? item.id}" quedaría dentro de su propia subcategoría`
      }
      seen.add(current)
      depth++
      current = byId.get(current)?.parentId ?? null
    }
    if (depth > maxDepth) {
      return `"${item.name ?? item.id}" quedaría en el nivel ${depth}: solo se permiten ${maxDepth}`
    }
  }
  return null
}

export interface TreeMove {
  id: string
  parentId: string | null
  position: number
}

/** Aplica movimientos sobre una copia de la lista (para validar antes de guardar). */
export function applyMoves<T extends TreeItem>(items: readonly T[], moves: readonly TreeMove[]): T[] {
  const byMove = new Map(moves.map((m) => [m.id, m]))
  return items.map((item) => {
    const move = byMove.get(item.id)
    return move ? { ...item, parentId: move.parentId, position: move.position } : item
  })
}

/**
 * Suma a cada categoría los conteos de sus descendientes.
 * `direct` da el conteo propio de cada una.
 */
export function totalsWithDescendants<T extends TreeItem>(
  items: readonly T[],
  direct: (item: T) => number,
): Map<string, number> {
  const totals = new Map<string, number>()
  const walk = (node: TreeNode<T>): number => {
    const total = direct(node) + node.children.reduce((sum, c) => sum + walk(c), 0)
    totals.set(node.id, total)
    return total
  }
  for (const root of buildTree(items)) walk(root)
  return totals
}
