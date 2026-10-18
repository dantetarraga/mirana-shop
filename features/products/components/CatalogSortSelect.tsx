'use client'

import { buildCatalogUrl, type CatalogUrlParams } from '@/features/products/lib/catalog-url'
import type { ProductSort } from '@/features/products/types'
import { startNavigationProgress } from '@/shared/components/layout/NavigationProgress'
import { Select } from '@/shared/components/ui/Select'
import { useRouter } from 'next/navigation'

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'newest', label: 'Más nuevos' },
]

interface CatalogSortSelectProps {
  value: ProductSort
  /** Filtros vigentes (sin página: cambiar el orden vuelve a la primera). */
  baseParams: Omit<CatalogUrlParams, 'page' | 'sort'>
  basePath?: string
}

export function CatalogSortSelect({ value, baseParams, basePath = '/catalogo' }: CatalogSortSelectProps) {
  const router = useRouter()

  return (
    <Select
      value={value}
      aria-label="Ordenar productos"
      onChange={(e) => {
        startNavigationProgress()
        router.push(buildCatalogUrl({ ...baseParams, sort: e.target.value }, basePath), {
          scroll: false,
        })
      }}
      className="font-display text-[14px] font-bold uppercase tracking-[0.5px] px-3.5 py-2.25 focus:border-accent-ink"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )
}
