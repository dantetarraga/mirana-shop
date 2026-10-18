import { MapPin, Package, User } from 'lucide-react'

export interface NavLinkItem {
  label: string
  href: string
}

/** Enlaces de la cuenta — compartidos por el menú del avatar y el drawer móvil. */
export const ACCOUNT_LINKS = [
  { label: 'Mi perfil', icon: User, href: '/cuenta/perfil' },
  { label: 'Mis pedidos', icon: Package, href: '/cuenta/pedidos' },
  { label: 'Mis direcciones', icon: MapPin, href: '/cuenta/direcciones' },
] as const

/**
 * Accesos rápidos de la tienda. `bar` = van como ítem propio en la barra de
 * escritorio junto a "Tienda"; el resto solo en el drawer móvil y en los
 * chips del inicio.
 */
export const QUICK_LINKS = [
  { label: 'Preventas', href: '/catalogo?avail=preorder', bar: true, accent: true },
  { label: 'Novedades', href: '/catalogo?sort=newest', bar: true, accent: false },
  { label: 'En stock', href: '/catalogo?avail=in_stock', bar: false, accent: false },
  { label: 'Ofertas', href: '/catalogo?oferta=1', bar: true, accent: true },
] as const

// ---------------------------------------------------------------------------
// Datos del mega-menú y del drawer móvil. Forma mínima y serializable: es lo
// único que viaja del layout (server) al Navbar (client). href de categoría =
// /categorias/[slug], de marca = /marcas/[slug].
// ---------------------------------------------------------------------------

export interface NavSubcategory {
  name: string
  slug: string
}

export interface NavCategory {
  name: string
  slug: string
  /** Todas las subcategorías con productos (el mega-menú recorta a MENU_MAX_CHILDREN). */
  children: NavSubcategory[]
}

export interface NavBrand {
  name: string
  slug: string
  imageUrl: string | null
}

export interface NavData {
  /** Raíces de la barra (máx. MENU_MAX_ROOTS), en el orden del admin. */
  menu: NavCategory[]
  /** Raíces que no entran: columna "Más" en escritorio; en móvil van seguidas. */
  overflow: NavCategory[]
  /** Marcas destacadas con productos (máx. MENU_MAX_FEATURED_BRANDS). */
  brands: NavBrand[]
  /** Colecciones activas (el mega-menú muestra MENU_MAX_COLLECTIONS). */
  collections: NavLinkItem[]
}

export const EMPTY_NAV: NavData = { menu: [], overflow: [], brands: [], collections: [] }
