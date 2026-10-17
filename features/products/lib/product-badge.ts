// ---------------------------------------------------------------------------
// Oferta y badge de producto — una sola regla para card, modal y ficha.
//
// Antes la ficha mostraba "DESTACADO"/"AGOTADO en rojo" y la card "TOP"/"AGOTADO
// en gris" y "-20%": el mismo producto se presentaba distinto según dónde se
// mirara. Este módulo es puro (sin 'use client') para usarse también en RSC.
// ---------------------------------------------------------------------------

export interface DiscountInfo {
  hasDiscount: boolean
  /** Porcentaje entero de descuento (0 si no hay oferta). */
  percent: number
  /** Ahorro por unidad en soles (0 si no hay oferta). */
  savings: number
}

export function getDiscount(p: { price: number; salePrice: number | null }): DiscountInfo {
  const hasDiscount = p.salePrice != null && p.salePrice < p.price && p.price > 0
  if (!hasDiscount) return { hasDiscount: false, percent: 0, savings: 0 }
  const sale = p.salePrice as number
  return {
    hasDiscount: true,
    percent: Math.round((1 - sale / p.price) * 100),
    savings: Math.round((p.price - sale) * 100) / 100,
  }
}

export interface ProductBadge {
  label: string
  className: string
}

/**
 * Una sola badge visible por producto, por prioridad:
 * agotado > preventa > oferta > nuevo > destacado.
 */
export function getProductBadge(p: {
  price: number
  salePrice: number | null
  status: string
  featured: boolean
  isNewArrival?: boolean
  isOutOfStock: boolean
}): ProductBadge | null {
  const { percent } = getDiscount(p)
  if (p.isOutOfStock) return { label: 'Agotado', className: 'bg-surface-700 text-white' }
  if (p.status === 'PREORDER') return { label: 'Preventa', className: 'bg-info text-white' }
  if (percent > 0) return { label: `-${percent}%`, className: 'bg-danger text-white' }
  if (p.isNewArrival) return { label: 'Nuevo', className: 'bg-success text-on-success' }
  if (p.featured) return { label: 'Destacado', className: 'bg-(--gold) text-on-accent' }
  return null
}
