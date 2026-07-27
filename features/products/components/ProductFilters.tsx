'use client'

import type { BrandRow } from '@/features/brands/types'
import type { CategoryRow } from '@/features/categories/types'
import type { CollectionRow } from '@/features/collections/types'
import { PRODUCT_STATUS_OPTIONS } from '@/features/products/lib/product-status'
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

/** Filtros de lista — la clave es también el nombre del parámetro en la URL */
type FilterKey = 'cat' | 'brand' | 'collection' | 'status'

interface ProductFiltersProps {
  categories: CategoryRow[]
  brands: BrandRow[]
  collections: CollectionRow[]
  currentQ: string
  currentCats: string[]
  currentBrands: string[]
  currentCollections: string[]
  currentStatuses: string[]
}

// Isla cliente mínima: solo los dropdowns multi-select.
// La búsqueda, los chips activos y la paginación viven en page.tsx (server).
export function ProductFilters({
  categories,
  brands,
  collections,
  currentQ,
  currentCats,
  currentBrands,
  currentCollections,
  currentStatuses,
}: ProductFiltersProps) {
  const router = useRouter()

  const selected: Record<FilterKey, string[]> = {
    cat: currentCats,
    brand: currentBrands,
    collection: currentCollections,
    status: currentStatuses,
  }

  // Cada dropdown solo cambia su propio parámetro; el resto de la URL se
  // reenvía tal cual, así que los filtros se acumulan en vez de pisarse.
  const toggle = (key: FilterKey, value: string) => {
    const list = selected[key]
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    router.push(buildUrl({ q: currentQ || undefined, ...selected, [key]: next }))
  }

  return (
    <>
      <FilterMultiSelect
        label="Categoría"
        className="min-w-44"
        options={categories.map((c) => ({ label: c.name, value: c.slug }))}
        selected={currentCats}
        onToggle={(val) => toggle('cat', val)}
      />
      <FilterMultiSelect
        label="Marca"
        className="min-w-44"
        options={brands.map((b) => ({ label: b.name, value: b.slug }))}
        selected={currentBrands}
        onToggle={(val) => toggle('brand', val)}
      />
      <FilterMultiSelect
        label="Colección"
        className="min-w-44"
        options={collections.map((c) => ({ label: c.name, value: c.slug }))}
        selected={currentCollections}
        onToggle={(val) => toggle('collection', val)}
      />
      <FilterMultiSelect
        label="Estado"
        className="min-w-44"
        options={PRODUCT_STATUS_OPTIONS}
        selected={currentStatuses}
        onToggle={(val) => toggle('status', val)}
      />
    </>
  )
}
