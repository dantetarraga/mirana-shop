export type CatalogUrlParams = {
  q?: string
  cat?: string[]
  brand?: string[]
  priceMin?: number
  priceMax?: number
  avail?: string[]
  oferta?: boolean
  sort?: string
  page?: number
}

export function buildCatalogUrl(params: CatalogUrlParams): string {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.cat?.length) p.set('cat', params.cat.join(','))
  if (params.brand?.length) p.set('brand', params.brand.join(','))
  if (params.priceMin != null) p.set('priceMin', String(params.priceMin))
  if (params.priceMax != null) p.set('priceMax', String(params.priceMax))
  if (params.avail?.length) p.set('avail', params.avail.join(','))
  if (params.oferta) p.set('oferta', '1')
  if (params.sort && params.sort !== 'relevance') p.set('sort', params.sort)
  if (params.page && params.page > 1) p.set('page', String(params.page))
  const qs = p.toString()
  return qs ? `/catalogo?${qs}` : '/catalogo'
}
