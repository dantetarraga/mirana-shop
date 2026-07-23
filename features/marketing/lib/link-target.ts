// ---------------------------------------------------------------------------
// Enlaces de marketing (CTA de banners, franja de inicio…).
//
// El admin no escribe URLs a mano: elige un destino y aquí se traduce a la ruta
// real del storefront. `parseLinkHref` hace el camino inverso para que al
// editar un banner existente el selector aparezca con el destino ya marcado.
//
// Rutas del storefront (ver app/(storefront)):
//   /                        inicio
//   /catalogo                catálogo completo
//   /catalogo?oferta=1       solo ofertas
//   /catalogo?cat=<slug>     filtrado por categoría
//   /catalogo?brand=<slug>   filtrado por marca
//   /catalogo/<slug>         detalle de producto
// ---------------------------------------------------------------------------

export type LinkTargetType =
  | 'none'
  | 'home'
  | 'catalog'
  | 'offers'
  | 'category'
  | 'brand'
  | 'product'
  | 'custom'

export interface LinkTarget {
  type: LinkTargetType
  /** Slug de categoría/marca/producto; la URL cruda cuando `type` es 'custom'. */
  value: string
}

export const LINK_TARGET_LABELS: Record<LinkTargetType, string> = {
  none: 'Sin enlace',
  home: 'Inicio',
  catalog: 'Catálogo completo',
  offers: 'Ofertas',
  category: 'Categoría',
  brand: 'Marca',
  product: 'Producto',
  custom: 'URL personalizada',
}

/** Orden en que se ofrecen los destinos en el selector. */
export const LINK_TARGET_TYPES: LinkTargetType[] = [
  'none',
  'catalog',
  'category',
  'brand',
  'product',
  'offers',
  'home',
  'custom',
]

/** Destino → href del storefront. Devuelve '' si aún falta elegir el slug. */
export function buildLinkHref({ type, value }: LinkTarget): string {
  switch (type) {
    case 'none':
      return ''
    case 'home':
      return '/'
    case 'catalog':
      return '/catalogo'
    case 'offers':
      return '/catalogo?oferta=1'
    case 'category':
      return value ? `/catalogo?cat=${encodeURIComponent(value)}` : ''
    case 'brand':
      return value ? `/catalogo?brand=${encodeURIComponent(value)}` : ''
    case 'product':
      return value ? `/catalogo/${encodeURIComponent(value)}` : ''
    case 'custom':
      return value
  }
}

/** href → destino. Lo que no encaje en un destino conocido cae en 'custom'. */
export function parseLinkHref(href: string | null | undefined): LinkTarget {
  const raw = (href ?? '').trim()
  if (!raw) return { type: 'none', value: '' }
  if (raw === '/') return { type: 'home', value: '' }
  if (!raw.startsWith('/catalogo')) return { type: 'custom', value: raw }

  const [path, query = ''] = raw.split('?')
  const params = new URLSearchParams(query)
  const keys = [...params.keys()]

  if (path === '/catalogo') {
    if (keys.length === 0) return { type: 'catalog', value: '' }
    // Un solo filtro: es un destino que el selector sabe representar. Con más
    // de uno (o con listas separadas por coma) se conserva la URL tal cual.
    if (keys.length === 1) {
      if (params.get('oferta') === '1') return { type: 'offers', value: '' }
      const cat = params.get('cat')
      if (cat && !cat.includes(',')) return { type: 'category', value: cat }
      const brand = params.get('brand')
      if (brand && !brand.includes(',')) return { type: 'brand', value: brand }
    }
    return { type: 'custom', value: raw }
  }

  const slug = path.startsWith('/catalogo/') ? path.slice('/catalogo/'.length) : ''
  if (slug && !slug.includes('/') && !query) {
    return { type: 'product', value: decodeURIComponent(slug) }
  }
  return { type: 'custom', value: raw }
}
