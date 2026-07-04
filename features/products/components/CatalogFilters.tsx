'use client'

import type { BrandRow } from '@/features/brands/types'
import type { CategoryRow } from '@/features/categories/types'
import { AVAILABILITY_OPTIONS, type AvailabilityOption } from '@/features/products/lib/availability'
import { buildCatalogUrl } from '@/features/products/lib/catalog-url'
import { Check, ChevronDown, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PRICE_PRESETS: [number | undefined, number | undefined, string][] = [
  [undefined, 150, 'Hasta S/150'],
  [150, 400, 'S/150 – S/400'],
  [400, 800, 'S/400 – S/800'],
  [800, undefined, 'Más de S/800'],
]

interface CatalogFiltersProps {
  categories: CategoryRow[]
  brands: BrandRow[]
  currentQ?: string
  currentSort?: string
  currentCats: string[]
  currentBrands: string[]
  currentAvail: AvailabilityOption[]
  currentOferta?: boolean
  priceMin?: number
  priceMax?: number
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export function CatalogFilters({
  categories,
  brands,
  currentQ,
  currentSort,
  currentCats,
  currentBrands,
  currentAvail,
  currentOferta,
  priceMin,
  priceMax,
}: CatalogFiltersProps) {
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['categoria', 'marca', 'precio', 'disponibilidad']),
  )
  const [brandSearch, setBrandSearch] = useState('')
  const [priceDraft, setPriceDraft] = useState({
    min: priceMin?.toString() ?? '',
    max: priceMax?.toString() ?? '',
  })

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function go(overrides: Partial<{ cat: string[]; brand: string[]; avail: string[]; oferta?: boolean; priceMin?: number; priceMax?: number }>) {
    router.push(
      buildCatalogUrl({
        q: currentQ,
        sort: currentSort,
        cat: overrides.cat ?? currentCats,
        brand: overrides.brand ?? currentBrands,
        avail: overrides.avail ?? currentAvail,
        oferta: 'oferta' in overrides ? overrides.oferta : currentOferta,
        priceMin: 'priceMin' in overrides ? overrides.priceMin : priceMin,
        priceMax: 'priceMax' in overrides ? overrides.priceMax : priceMax,
      }),
    )
  }

  function applyPrice() {
    const min = priceDraft.min ? Number(priceDraft.min) : undefined
    const max = priceDraft.max ? Number(priceDraft.max) : undefined
    go({ priceMin: min, priceMax: max })
  }

  function clearAll() {
    router.push(buildCatalogUrl({ q: currentQ, sort: currentSort }))
  }

  const filteredBrands = brandSearch
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...currentCats.map((slug) => {
      const cat = categories.find((c) => c.slug === slug)
      return { key: `cat-${slug}`, label: cat?.name ?? slug, onRemove: () => go({ cat: currentCats.filter((c) => c !== slug) }) }
    }),
    ...currentBrands.map((slug) => {
      const brand = brands.find((b) => b.slug === slug)
      return { key: `brand-${slug}`, label: brand?.name ?? slug, onRemove: () => go({ brand: currentBrands.filter((b) => b !== slug) }) }
    }),
    ...currentAvail.map((val) => {
      const opt = AVAILABILITY_OPTIONS.find((o) => o.value === val)
      return { key: `avail-${val}`, label: opt?.label ?? val, onRemove: () => go({ avail: currentAvail.filter((a) => a !== val) }) }
    }),
    ...(currentOferta
      ? [{ key: 'oferta', label: 'En oferta', onRemove: () => go({ oferta: undefined }) }]
      : []),
    ...(priceMin != null || priceMax != null
      ? [
          {
            key: 'price',
            label: `S/${priceMin ?? 0} – S/${priceMax ?? '∞'}`,
            onRemove: () => {
              setPriceDraft({ min: '', max: '' })
              go({ priceMin: undefined, priceMax: undefined })
            },
          },
        ]
      : []),
  ]

  const hasActiveFilters = chips.length > 0

  return (
    <aside className="bg-surf border border-(--bd) sticky top-[calc(var(--nh)+20px)]">
      <div className="px-5 py-4 border-b border-(--bd) flex items-center justify-between">
        <span className="font-display text-[20px] font-black uppercase tracking-[0.5px]">Filtros</span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-[11px] tracking-[1px] uppercase text-muted hover:text-(--gold) transition-colors"
          >
            <X size={12} /> Limpiar todo
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="px-4 py-3 border-b border-(--bd) flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <div
              key={chip.key}
              className="flex items-center gap-1.5 bg-(--gd) border border-[rgba(0,200,255,.25)] text-(--gold) text-[11px] px-2.5 py-1"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="opacity-70 hover:opacity-100">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Categoría */}
      <FilterGroup id="categoria" label="Categoría" open={openGroups.has('categoria')} onToggle={toggleGroup}>
        {categories.map((cat) => (
          <FilterCheckbox
            key={cat.id}
            checked={currentCats.includes(cat.slug)}
            onClick={() => go({ cat: toggle(currentCats, cat.slug) })}
            label={cat.name}
            count={cat.productCount}
          />
        ))}
      </FilterGroup>

      {/* Marca */}
      <FilterGroup id="marca" label="Marca" open={openGroups.has('marca')} onToggle={toggleGroup}>
        <input
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          placeholder="Buscar marca…"
          className="w-full bg-card border border-(--bd) text-text text-[12px] px-2.5 py-2 mb-2.5 outline-none focus:border-(--gold) placeholder:text-muted"
        />
        {filteredBrands.map((brand) => (
          <FilterCheckbox
            key={brand.id}
            checked={currentBrands.includes(brand.slug)}
            onClick={() => go({ brand: toggle(currentBrands, brand.slug) })}
            label={brand.name}
            count={brand.productCount}
          />
        ))}
      </FilterGroup>

      {/* Precio */}
      <FilterGroup id="precio" label="Precio" open={openGroups.has('precio')} onToggle={toggleGroup}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-display text-[13px] font-bold text-muted">
              S/
            </span>
            <input
              type="number"
              min={0}
              value={priceDraft.min}
              onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
              className="w-full bg-card border border-(--bd) text-text font-display text-[14px] font-bold pl-7 pr-2 py-2 outline-none focus:border-(--gold)"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-display text-[13px] font-bold text-muted">
              S/
            </span>
            <input
              type="number"
              min={0}
              value={priceDraft.max}
              onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
              className="w-full bg-card border border-(--bd) text-text font-display text-[14px] font-bold pl-7 pr-2 py-2 outline-none focus:border-(--gold)"
            />
          </div>
        </div>
        <button
          onClick={applyPrice}
          className="w-full border border-(--bd) text-text font-display text-[12px] font-bold tracking-[1px] uppercase py-2 mb-3 hover:border-(--gold) hover:text-(--gold) transition-colors"
        >
          Aplicar
        </button>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map(([min, max, label]) => (
            <button
              key={label}
              onClick={() => {
                setPriceDraft({ min: min?.toString() ?? '', max: max?.toString() ?? '' })
                go({ priceMin: min, priceMax: max })
              }}
              className="border border-(--bd) text-muted text-[11px] px-2.5 py-1 hover:border-muted hover:text-text transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Disponibilidad */}
      <FilterGroup
        id="disponibilidad"
        label="Disponibilidad"
        open={openGroups.has('disponibilidad')}
        onToggle={toggleGroup}
        last
      >
        {AVAILABILITY_OPTIONS.map((opt) => (
          <FilterCheckbox
            key={opt.value}
            checked={currentAvail.includes(opt.value)}
            onClick={() => go({ avail: toggle(currentAvail, opt.value) })}
            label={opt.label}
          />
        ))}
      </FilterGroup>
    </aside>
  )
}

function FilterGroup({
  id,
  label,
  open,
  onToggle,
  last,
  children,
}: {
  id: string
  label: string
  open: boolean
  onToggle: (id: string) => void
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={last ? '' : 'border-b border-(--bd)'}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-3.5 font-display text-[15px] font-extrabold uppercase tracking-[0.5px] text-text hover:text-(--gold) transition-colors"
      >
        {label}
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

function FilterCheckbox({
  checked,
  onClick,
  label,
  count,
}: {
  checked: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <label
      onClick={onClick}
      className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
    >
      <span
        className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-colors ${
          checked ? 'bg-(--gold) border-(--gold)' : 'border-(--bd) bg-transparent'
        }`}
      >
        {checked && <Check size={10} className="text-black" strokeWidth={3} />}
      </span>
      <span className={`flex-1 text-[13px] transition-colors ${checked ? 'text-text' : 'text-muted group-hover:text-text'}`}>
        {label}
      </span>
      {count != null && <span className="text-[11px] text-muted opacity-55">{count}</span>}
    </label>
  )
}
