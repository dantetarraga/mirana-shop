import {
  ancestorsOf,
  buildTree,
  childrenOf,
  descendantsOf,
  sortAsTree,
  totalsWithDescendants,
} from '@/features/categories/lib/category-tree'
import type {
  CategoryPageData,
  CategoryRow,
  MenuCategory,
} from '@/features/categories/types'

// ---------------------------------------------------------------------------
// Derivados puros de la lista pública de categorías (ya filtrada a vivas y
// visibles, con conteos públicos DIRECTOS). Las queries los envuelven en
// caché; viven aquí para poder testearlos sin BD.
// ---------------------------------------------------------------------------

/**
 * Deja solo lo que la tienda puede mostrar: visibles y cuyo padre (si tiene)
 * también es visible. Ocultar una raíz oculta toda su rama.
 */
export function filterPublicNodes(rows: readonly CategoryRow[]): CategoryRow[] {
  const visible = new Map(rows.filter((r) => r.isVisible).map((r) => [r.id, r]))
  const reachable = (row: CategoryRow, seen = new Set<string>()): boolean => {
    if (!row.parentId) return true
    if (seen.has(row.id)) return false
    seen.add(row.id)
    const parent = visible.get(row.parentId)
    return parent ? reachable(parent, seen) : false
  }
  return sortAsTree([...visible.values()].filter((r) => reachable(r)))
}

/**
 * Mega-menú: raíces con `showInMenu` ordenadas por `position`, cada una con
 * sus subcategorías visibles. Se omite todo lo que no tiene productos
 * públicos (contando descendientes).
 */
export function buildMenuTree(nodes: readonly CategoryRow[]): MenuCategory[] {
  const totals = totalsWithDescendants(nodes, (n) => n.productCount)
  return buildTree(nodes)
    .filter((root) => !root.parentId && root.showInMenu && (totals.get(root.id) ?? 0) > 0)
    .map((root) => ({
      id: root.id,
      name: root.name,
      slug: root.slug,
      imageUrl: root.imageUrl,
      productCount: totals.get(root.id) ?? 0,
      children: root.children
        .filter((c) => (totals.get(c.id) ?? 0) > 0)
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: totals.get(c.id) ?? 0,
        })),
    }))
}

/** Datos de /categorias/[slug]. null si no existe, está oculta o en la papelera. */
export function buildCategoryPageData(
  nodes: readonly CategoryRow[],
  slug: string,
): CategoryPageData | null {
  const category = nodes.find((n) => n.slug === slug)
  if (!category) return null

  const totals = totalsWithDescendants(nodes, (n) => n.productCount)
  const link = (n: CategoryRow) => ({ id: n.id, name: n.name, slug: n.slug })
  const descendantIds = descendantsOf(nodes, category.id)
  const children = childrenOf(nodes, category.id)

  return {
    category: {
      ...link(category),
      parentId: category.parentId,
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: totals.get(category.id) ?? 0,
    },
    ancestors: ancestorsOf(nodes, category.id).map(link),
    children: children.map((c) => ({
      ...link(c),
      imageUrl: c.imageUrl,
      productCount: totals.get(c.id) ?? 0,
    })),
    descendantIds,
    categoryIds: [category.id, ...descendantIds],
  }
}
