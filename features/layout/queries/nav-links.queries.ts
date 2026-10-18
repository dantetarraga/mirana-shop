import 'server-only'

import { getPublicBrands } from '@/features/brands/queries/brand.queries'
import { MENU_MAX_FEATURED_BRANDS, splitMenuRoots } from '@/features/categories/lib/menu-limits'
import { getMenuTree } from '@/features/categories/queries/category.queries'
import { getCollections } from '@/features/collections/queries/collection.queries'
import type { NavCategory, NavData } from '@/shared/components/layout/nav-links'

/** Colecciones que viajan al menú (el drawer móvil muestra todas éstas). */
const NAV_COLLECTIONS_LIMIT = 8

/**
 * Mega-menú y drawer móvil, compartidos por los layouts de tienda y cuenta.
 * Todo sale de queries cacheadas (getMenuTree, getPublicBrands, colecciones
 * públicas) y `cache()` las resuelve una sola vez por request aunque la home
 * pida las mismas. Solo se devuelve lo que el menú pinta: no se serializa la
 * fila entera al cliente.
 */
export async function getNavLinks(): Promise<NavData> {
  const [tree, featured, collections] = await Promise.all([
    getMenuTree(),
    getPublicBrands({ featuredOnly: true }),
    getCollections({ active: true, perPage: 50 }),
  ])

  const roots: NavCategory[] = tree.map((root) => ({
    name: root.name,
    slug: root.slug,
    children: root.children.map((c) => ({ name: c.name, slug: c.slug })),
  }))
  const { bar, overflow } = splitMenuRoots(roots)

  return {
    menu: bar,
    overflow,
    brands: featured
      .filter((b) => b.productCount > 0)
      .slice(0, MENU_MAX_FEATURED_BRANDS)
      .map((b) => ({ name: b.name, slug: b.slug, imageUrl: b.imageUrl })),
    collections: collections
      .slice(0, NAV_COLLECTIONS_LIMIT)
      .map((c) => ({ label: c.name, href: `/colecciones/${c.slug}` })),
  }
}
