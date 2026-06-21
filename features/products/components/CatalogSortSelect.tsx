'use client'

import { buildCatalogUrl } from '@/features/products/lib/catalog-url'
import type { ProductSort } from '@/features/products/types'
import { useRouter } from 'next/navigation'

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'newest', label: 'Más nuevos' },
]

interface CatalogSortSelectProps {
  value: ProductSort
  q?: string
  cat: string[]
  brand: string[]
  avail: string[]
  priceMin?: number
  priceMax?: number
}

export function CatalogSortSelect({ value, q, cat, brand, avail, priceMin, priceMax }: CatalogSortSelectProps) {
  const router = useRouter()

  return (
    <select
      value={value}
      onChange={(e) =>
        router.push(
          buildCatalogUrl({ q, cat, brand, avail, priceMin, priceMax, sort: e.target.value }),
        )
      }
      className="bg-card border border-(--bd) text-text font-display text-[14px] font-bold uppercase tracking-[0.5px] px-3.5 py-2.25 outline-none cursor-pointer focus:border-(--gold)"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
