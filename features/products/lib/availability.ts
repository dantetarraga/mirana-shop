import type { ProductStatus } from '@/generated/prisma/client'
import type { StockFilter } from '@/features/products/types'

export type AvailabilityOption = 'in_stock' | 'low_stock' | 'preorder'

export const AVAILABILITY_OPTIONS: { value: AvailabilityOption; label: string }[] = [
  { value: 'in_stock', label: 'En stock' },
  { value: 'low_stock', label: 'Pocas unidades' },
  { value: 'preorder', label: 'Pre-orden' },
]

/** Estados visibles en el catálogo público cuando no hay filtro de disponibilidad activo. */
export const DEFAULT_CATALOG_STATUSES: ProductStatus[] = ['AVAILABLE', 'PREORDER', 'SOLD_OUT']

export function resolveAvailability(selected: AvailabilityOption[]): {
  status: ProductStatus[]
  stockFilter: StockFilter
} {
  if (selected.length === 0) {
    return { status: DEFAULT_CATALOG_STATUSES, stockFilter: 'all' }
  }

  const statuses = new Set<ProductStatus>()
  if (selected.includes('in_stock') || selected.includes('low_stock')) statuses.add('AVAILABLE')
  if (selected.includes('preorder')) statuses.add('PREORDER')

  const stockFilter: StockFilter =
    selected.includes('low_stock') && !selected.includes('in_stock') ? 'low' : 'all'

  return { status: Array.from(statuses), stockFilter }
}
