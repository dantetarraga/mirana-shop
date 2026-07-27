import type { ProductListItem } from '@/features/products/types'

/** Fila del listado del admin */
export type HomeSectionRow = {
  id: string
  title: string
  eyebrow: string
  /** Vacío = el botón "Ver todos" apunta al catálogo */
  ctaHref: string
  position: number
  active: boolean
  /** Productos enlazados, incluidos los que hoy no se ven en la tienda */
  productCount: number
}

/** Opción del multi-select de la ficha de producto */
export type HomeSectionOption = {
  id: string
  title: string
  /** Oculta: se puede enlazar igual, pero hoy no se ve en el inicio */
  active: boolean
}

/** Sección lista para pintar en el inicio */
export type HomeSectionWithProducts = {
  id: string
  title: string
  eyebrow: string
  ctaHref: string
  products: ProductListItem[]
}

/** Destino del "Ver todos" cuando la sección no define uno propio */
export const HOME_SECTION_DEFAULT_HREF = '/catalogo'

/** Tope de productos por sección en el inicio — dos filas completas de 4 */
export const HOME_SECTION_MAX_ITEMS = 8
