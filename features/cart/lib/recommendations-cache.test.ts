import { describe, expect, it } from 'vitest'
import { createTtlCache, recommendationsCacheKey } from './recommendations-cache'

describe('recommendationsCacheKey', () => {
  it('distingue tipo de carrito y productos excluidos', () => {
    const base = recommendationsCacheKey('p1', 'STANDARD', ['a', 'b'])
    expect(recommendationsCacheKey('p1', 'PREORDER', ['a', 'b'])).not.toBe(base)
    expect(recommendationsCacheKey('p1', 'STANDARD', ['a'])).not.toBe(base)
    expect(recommendationsCacheKey('p2', 'STANDARD', ['a', 'b'])).not.toBe(base)
  })

  it('no depende del orden ni de duplicados', () => {
    expect(recommendationsCacheKey('p1', 'STANDARD', ['b', 'a', 'a'])).toBe(
      recommendationsCacheKey('p1', 'STANDARD', ['a', 'b']),
    )
  })
})

describe('createTtlCache', () => {
  it('caduca las entradas pasado el TTL', () => {
    let t = 0
    const cache = createTtlCache<string>(1000, () => t)
    cache.set('k', 'v')
    t = 999
    expect(cache.get('k')).toBe('v')
    t = 1000
    expect(cache.get('k')).toBeUndefined()
  })

  it('borra una entrada a pedido', () => {
    const cache = createTtlCache<number>(1000, () => 0)
    cache.set('k', 1)
    cache.delete('k')
    expect(cache.get('k')).toBeUndefined()
  })
})
