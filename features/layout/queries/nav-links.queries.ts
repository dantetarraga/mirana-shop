import 'server-only'

import { getCategories } from '@/features/categories/queries/category.queries'
import { getCollections } from '@/features/collections/queries/collection.queries'
import type { NavLinkItem } from '@/shared/components/layout/Navbar'

/** Cuántas categorías/colecciones ofrece el menú móvil. */
const MOBILE_NAV_LIMIT = 8

/**
 * Enlaces del menú móvil, compartidos por los layouts de tienda y cuenta.
 * Mismos argumentos que la home (`perPage: 50`, `active: true`) para que la
 * deduplicación por request de las queries las resuelva una sola vez. Solo se
 * devuelve lo que el menú necesita: no se serializa la fila entera al cliente.
 */
export async function getNavLinks(): Promise<{
  categories: NavLinkItem[]
  collections: NavLinkItem[]
}> {
  const [categories, collections] = await Promise.all([
    getCategories({ perPage: 50 }),
    getCollections({ active: true, perPage: 50 }),
  ])

  return {
    categories: categories
      .filter((c) => c.parentId === null)
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, MOBILE_NAV_LIMIT)
      .map((c) => ({ label: c.name, href: `/catalogo?cat=${c.slug}` })),
    collections: collections
      .slice(0, MOBILE_NAV_LIMIT)
      .map((c) => ({ label: c.name, href: `/colecciones/${c.slug}` })),
  }
}
