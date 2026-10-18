import { describe, expect, it } from 'vitest'
import { legacyCatalogRedirect, parseCatalogParams } from './catalog-params'

describe('parseCatalogParams', () => {
  it('normaliza listas, orden, página y precios inválidos', () => {
    const p = parseCatalogParams({
      cat: 'lego,,lego,anime',
      avail: 'preorder,nope',
      sort: 'raro',
      page: '-3',
      priceMin: 'abc',
      priceMax: '200',
      oferta: '1',
    })
    expect(p.cats).toEqual(['lego', 'anime'])
    expect(p.avail).toEqual(['preorder'])
    expect(p.sort).toBe('relevance')
    expect(p.page).toBe(1)
    expect(p.priceMin).toBeUndefined()
    expect(p.priceMax).toBe(200)
    expect(p.onSale).toBe(true)
  })
})

describe('legacyCatalogRedirect', () => {
  it('?cat=x como único parámetro → /categorias/x', () => {
    expect(legacyCatalogRedirect({ cat: 'lego' })).toBe('/categorias/lego')
  })
  it('?brand=x como único parámetro → /marcas/x', () => {
    expect(legacyCatalogRedirect({ brand: 'bandai' })).toBe('/marcas/bandai')
  })
  it('no redirige con varios valores o más filtros', () => {
    expect(legacyCatalogRedirect({ cat: 'lego,anime' })).toBeNull()
    expect(legacyCatalogRedirect({ cat: 'lego', sort: 'newest' })).toBeNull()
    expect(legacyCatalogRedirect({})).toBeNull()
  })
})
