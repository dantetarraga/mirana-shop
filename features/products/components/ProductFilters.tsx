'use client'

import type { BrandRow } from '@/features/brands/types'
import type { CategoryRow } from '@/features/categories/types'
import type { CollectionRow } from '@/features/collections/types'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { useRouter } from 'next/navigation'

function buildUrl(params: Record<string, string | string[] | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue
    const val = Array.isArray(v) ? v.join(',') : v
    if (val) p.set(k, val)
  }
  const qs = p.toString()
  return qs ? `/admin/products?${qs}` : '/admin/products'
}

interface ProductFiltersProps {
  categories: CategoryRow[]
  brands: BrandRow[]
  collections: CollectionRow[]
  currentQ: string
  currentCats: string[]
  currentBrands: string[]
  currentCollections: string[]
}

// Isla cliente mínima: solo los 3 dropdowns multi-select.
// La búsqueda, los chips activos y la paginación viven en page.tsx (server).
export function ProductFilters({
  categories,
  brands,
  collections,
  currentQ,
  currentCats,
  currentBrands,
  currentCollections,
}: ProductFiltersProps) {
  const router = useRouter()

  return (
    <>
      <FilterMultiSelect
        label="Categoría"
        options={categories.map((c) => ({ label: c.name, value: c.slug }))}
        selected={currentCats}
        onToggle={(val) => {
          const next = currentCats.includes(val)
            ? currentCats.filter((v) => v !== val)
            : [...currentCats, val]
          router.push(
            buildUrl({
              q: currentQ || undefined,
              cat: next.length > 0 ? next : undefined,
              brand: currentBrands.length > 0 ? currentBrands : undefined,
              collection: currentCollections.length > 0 ? currentCollections : undefined,
            }),
          )
        }}
      />
      <FilterMultiSelect
        label="Marca"
        options={brands.map((b) => ({ label: b.name, value: b.slug }))}
        selected={currentBrands}
        onToggle={(val) => {
          const next = currentBrands.includes(val)
            ? currentBrands.filter((v) => v !== val)
            : [...currentBrands, val]
          router.push(
            buildUrl({
              q: currentQ || undefined,
              cat: currentCats.length > 0 ? currentCats : undefined,
              brand: next.length > 0 ? next : undefined,
              collection: currentCollections.length > 0 ? currentCollections : undefined,
            }),
          )
        }}
      />
      <FilterMultiSelect
        label="Colección"
        options={collections.map((c) => ({ label: c.name, value: c.slug }))}
        selected={currentCollections}
        onToggle={(val) => {
          const next = currentCollections.includes(val)
            ? currentCollections.filter((v) => v !== val)
            : [...currentCollections, val]
          router.push(
            buildUrl({
              q: currentQ || undefined,
              cat: currentCats.length > 0 ? currentCats : undefined,
              brand: currentBrands.length > 0 ? currentBrands : undefined,
              collection: next.length > 0 ? next : undefined,
            }),
          )
        }}
      />
    </>
  )
}
