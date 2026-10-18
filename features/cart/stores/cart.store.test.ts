import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// El store llama a server actions; aquí solo importa el estado local.
vi.mock('@/features/cart/actions/cart.actions', () => {
  const ok = vi.fn(() => new Promise(() => {}))
  return {
    addCartItemAction: ok,
    addCartItemsAction: ok,
    clearCartAction: vi.fn(() => Promise.resolve([])),
    getCartAction: vi.fn(() => Promise.resolve([])),
    removeCartItemAction: ok,
    setCartItemModeAction: ok,
    setCartItemQtyAction: ok,
  }
})
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { warning: vi.fn(), error: vi.fn(), success: vi.fn() }) }))

const { useCartStore } = await import('./cart.store')

function product(id: string, status: CatalogProduct['status']): CatalogProduct {
  return {
    id,
    sku: id,
    slug: id,
    name: id,
    price: 100,
    salePrice: null,
    status,
    featured: false,
    createdAt: new Date(0),
    isNewArrival: false,
    category: { id: 'c', name: 'c', slug: 'c' },
    brand: { id: 'b', name: 'b', slug: 'b' },
    imageUrl: null,
    images: [],
    stock: 10,
    allowPartialPreorder: false,
    preorderDepositPercent: null,
    estimatedArrival: null,
  }
}

const standard = product('std', 'AVAILABLE')
const preorder = product('pre', 'PREORDER')

beforeEach(() => {
  useCartStore.setState({
    cart: [{ product: standard, qty: 1, preorderMode: 'FULL' }],
    cartCount: 1,
    cartOpen: true,
    lastAdded: standard,
    pendingWrites: 0,
    mixConflict: null,
  })
})

describe('conflicto de tipos con el drawer abierto', () => {
  it('cierra el drawer para que el modal quede encima', () => {
    expect(useCartStore.getState().addToCart(preorder, 1, 'FULL', { openDrawer: false })).toBe(0)
    const s = useCartStore.getState()
    expect(s.mixConflict?.drawerWasOpen).toBe(true)
    expect(s.cartOpen).toBe(false)
  })

  it('al descartar vuelve a abrir el drawer', () => {
    useCartStore.getState().addToCart(preorder, 1, 'FULL', { openDrawer: false })
    useCartStore.getState().dismissMixConflict()
    expect(useCartStore.getState().cartOpen).toBe(true)
    expect(useCartStore.getState().mixConflict).toBeNull()
  })

  it("al reemplazar vuelve a abrir el drawer con el producto nuevo", () => {
    useCartStore.getState().addToCart(preorder, 1, 'FULL', { openDrawer: false })
    useCartStore.getState().resolveMixConflict('replace')
    const s = useCartStore.getState()
    expect(s.cartOpen).toBe(true)
    expect(s.cart.map((i) => i.product.id)).toEqual(['pre'])
  })

  it('al vaciar vuelve a abrir el drawer (vacío)', () => {
    useCartStore.getState().addToCart(preorder, 1, 'FULL', { openDrawer: false })
    useCartStore.getState().resolveMixConflict('empty')
    expect(useCartStore.getState().cartOpen).toBe(true)
    expect(useCartStore.getState().cart).toEqual([])
  })
})

describe('conflicto de tipos con el drawer cerrado', () => {
  beforeEach(() => useCartStore.setState({ cartOpen: false, lastAdded: null }))

  it('descartar no abre el drawer', () => {
    useCartStore.getState().addToCart(preorder)
    useCartStore.getState().dismissMixConflict()
    expect(useCartStore.getState().cartOpen).toBe(false)
  })

  it("reemplazar desde 'Agregar al carrito' abre el drawer anclado al nuevo", () => {
    useCartStore.getState().addToCart(preorder)
    useCartStore.getState().resolveMixConflict('replace')
    const s = useCartStore.getState()
    expect(s.cartOpen).toBe(true)
    expect(s.lastAdded?.id).toBe('pre')
  })

  it('vaciar no abre el drawer', () => {
    useCartStore.getState().addToCart(preorder)
    useCartStore.getState().resolveMixConflict('empty')
    expect(useCartStore.getState().cartOpen).toBe(false)
  })
})
