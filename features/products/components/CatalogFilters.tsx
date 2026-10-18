'use client'

import { AVAILABILITY_OPTIONS, type AvailabilityOption } from '@/features/products/lib/availability'
import {
  isChildChecked,
  parentCheckState,
  toggleChild,
  toggleParent,
} from '@/features/products/lib/category-filter'
import { buildCatalogUrl } from '@/features/products/lib/catalog-url'
import { startNavigationProgress } from '@/shared/components/layout/NavigationProgress'
import { cn } from '@/shared/lib/utils'
import { Check, ChevronDown, Minus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState } from 'react'

const PRICE_PRESETS: [number | undefined, number | undefined, string][] = [
  [undefined, 150, 'Hasta S/150'],
  [150, 400, 'S/150 – S/400'],
  [400, 800, 'S/400 – S/800'],
  [800, undefined, 'Más de S/800'],
]

/** Marcas visibles antes de "Ver más". */
const BRANDS_VISIBLE = 12

/** Lo mínimo que el panel necesita de cada categoría (lista pública en preorden). */
export interface FilterCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export interface FilterBrand {
  id: string
  name: string
  slug: string
}

/** Conteos facetados (ver features/products/queries/facets.queries.ts). */
export interface FilterFacets {
  categories: Record<string, number>
  brands: Record<string, number>
  availability: Record<AvailabilityOption, number>
}

interface CatalogFiltersProps {
  /** Página que lista: /catalogo, /categorias/[slug] o /marcas/[slug]. */
  basePath?: string
  /** Sin categorías no se muestra el grupo (la página ya fija el ámbito). */
  categories?: FilterCategory[]
  brands?: FilterBrand[]
  facets: FilterFacets
  currentQ?: string
  currentSort?: string
  currentCats: string[]
  currentBrands: string[]
  currentAvail: AvailabilityOption[]
  currentOferta?: boolean
  priceMin?: number
  priceMax?: number
}

function toggle<T>(arr: readonly T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export function CatalogFilters({
  basePath = '/catalogo',
  categories = [],
  brands = [],
  facets,
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
  const brandSearchId = useId()
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(['categoria', 'marca', 'precio', 'disponibilidad']),
  )
  const [brandSearch, setBrandSearch] = useState('')
  const [brandsExpanded, setBrandsExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [priceDraft, setPriceDraft] = useState({
    min: priceMin?.toString() ?? '',
    max: priceMax?.toString() ?? '',
  })

  // Raíces con sus hijas (la lista llega en preorden, ya ordenada).
  const tree = useMemo(() => {
    const kids = new Map<string, FilterCategory[]>()
    for (const c of categories) {
      if (!c.parentId) continue
      const list = kids.get(c.parentId)
      if (list) list.push(c)
      else kids.set(c.parentId, [c])
    }
    return categories
      .filter((c) => !c.parentId)
      .map((root) => {
        const children = kids.get(root.id) ?? []
        const count =
          (facets.categories[root.id] ?? 0) +
          children.reduce((sum, c) => sum + (facets.categories[c.id] ?? 0), 0)
        return { root, children, count }
      })
  }, [categories, facets.categories])

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function go(
    overrides: Partial<{
      cat: string[]
      brand: string[]
      avail: string[]
      oferta?: boolean
      priceMin?: number
      priceMax?: number
    }>,
  ) {
    startNavigationProgress()
    router.push(
      buildCatalogUrl(
        {
          q: currentQ,
          sort: currentSort,
          cat: overrides.cat ?? currentCats,
          brand: overrides.brand ?? currentBrands,
          avail: overrides.avail ?? currentAvail,
          oferta: 'oferta' in overrides ? overrides.oferta : currentOferta,
          priceMin: 'priceMin' in overrides ? overrides.priceMin : priceMin,
          priceMax: 'priceMax' in overrides ? overrides.priceMax : priceMax,
        },
        basePath,
      ),
      { scroll: false },
    )
  }

  function applyPrice() {
    const toPrice = (v: string) => {
      const n = Number(v)
      return v !== '' && Number.isFinite(n) && n >= 0 ? n : undefined
    }
    go({ priceMin: toPrice(priceDraft.min), priceMax: toPrice(priceDraft.max) })
  }

  function clearAll() {
    setPriceDraft({ min: '', max: '' })
    startNavigationProgress()
    router.push(buildCatalogUrl({ q: currentQ, sort: currentSort }, basePath), { scroll: false })
  }

  // Marcas: las marcadas primero (para que "Ver más" nunca esconda una
  // selección activa), luego el orden del admin.
  const query = brandSearch.trim().toLowerCase()
  const sortedBrands = [
    ...brands.filter((b) => currentBrands.includes(b.slug)),
    ...brands.filter((b) => !currentBrands.includes(b.slug)),
  ]
  const matchingBrands = query
    ? sortedBrands.filter((b) => b.name.toLowerCase().includes(query))
    : sortedBrands
  const visibleBrands =
    query || brandsExpanded ? matchingBrands : matchingBrands.slice(0, BRANDS_VISIBLE)
  const hiddenBrands = matchingBrands.length - visibleBrands.length

  const labelOfCategory = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...(categories.length > 0
      ? currentCats.map((slug) => ({
          key: `cat-${slug}`,
          label: labelOfCategory(slug),
          onRemove: () => go({ cat: currentCats.filter((c) => c !== slug) }),
        }))
      : []),
    ...(brands.length > 0
      ? currentBrands.map((slug) => ({
          key: `brand-${slug}`,
          label: brands.find((b) => b.slug === slug)?.name ?? slug,
          onRemove: () => go({ brand: currentBrands.filter((b) => b !== slug) }),
        }))
      : []),
    ...currentAvail.map((val) => ({
      key: `avail-${val}`,
      label: AVAILABILITY_OPTIONS.find((o) => o.value === val)?.label ?? val,
      onRemove: () => go({ avail: currentAvail.filter((a) => a !== val) }),
    })),
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
    <aside
      aria-label="Filtros"
      className="bg-surf border border-(--bd) lg:sticky lg:top-[calc(var(--nh)+20px)] lg:max-h-[calc(100dvh-var(--nh)-40px)] lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin]"
    >
      <div className="sticky top-(--nh) lg:top-0 z-40 bg-surf px-5 py-4 border-b border-(--bd) flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="catalog-filters-body"
          className="flex-1 flex items-center gap-3 font-display text-[20px] font-black uppercase tracking-[0.5px] text-left justify-between lg:pointer-events-none"
        >
          <span className="flex items-center gap-2.5">
            Filtros
            {hasActiveFilters && (
              <span className="text-[11px] font-display font-bold px-1.5 py-0.5 bg-(--gold) text-on-accent">
                <span className="sr-only">activos: </span>
                {chips.length}
              </span>
            )}
          </span>
          <ChevronDown
            size={16}
            aria-hidden
            className={cn('text-muted transition-transform lg:hidden', mobileOpen && 'rotate-180')}
          />
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 flex items-center gap-1.5 min-h-8 text-[11px] tracking-[1px] uppercase text-muted hover:text-accent-ink transition-colors"
          >
            <X size={12} aria-hidden /> Limpiar todo
          </button>
        )}
      </div>

      <div id="catalog-filters-body" className={cn(mobileOpen ? 'block' : 'hidden', 'lg:block')}>
        {hasActiveFilters && (
          <ul aria-label="Filtros activos" className="px-4 py-3 border-b border-(--bd) flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <li
                key={chip.key}
                className="flex items-center gap-1.5 bg-(--gd) border border-(--bdh) text-accent-ink text-[11px] pl-2.5 pr-1 py-0.5"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="grid place-items-center size-6 opacity-70 hover:opacity-100"
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {tree.length > 0 && (
          <FilterGroup
            id="categoria"
            label="Categoría"
            open={openGroups.has('categoria')}
            onToggle={toggleGroup}
          >
            <ul className="flex flex-col">
              {tree.map(({ root, children, count }) => {
                const childSlugs = children.map((c) => c.slug)
                const state = parentCheckState(currentCats, root.slug, childSlugs)
                return (
                  <li key={root.id}>
                    <FilterCheckbox
                      checked={state === 'checked'}
                      indeterminate={state === 'indeterminate'}
                      onChange={() => go({ cat: toggleParent(currentCats, root.slug, childSlugs) })}
                      label={root.name}
                      count={count}
                    />
                    {children.length > 0 && (
                      <ul className="ml-2 pl-3.5 border-l border-(--bd)">
                        {children.map((child) => (
                          <li key={child.id}>
                            <FilterCheckbox
                              checked={isChildChecked(currentCats, root.slug, child.slug)}
                              onChange={() =>
                                go({ cat: toggleChild(currentCats, root.slug, childSlugs, child.slug) })
                              }
                              label={child.name}
                              count={facets.categories[child.id] ?? 0}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </FilterGroup>
        )}

        {brands.length > 0 && (
          <FilterGroup id="marca" label="Marca" open={openGroups.has('marca')} onToggle={toggleGroup}>
            <label htmlFor={brandSearchId} className="sr-only">
              Buscar marca
            </label>
            <input
              id={brandSearchId}
              type="search"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Buscar marca…"
              autoComplete="off"
              className="w-full bg-card border border-field text-text text-[13px] px-2.5 py-2 mb-2.5 outline-none focus-visible:border-accent-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring placeholder:text-muted"
            />
            {visibleBrands.length === 0 ? (
              <p className="text-[12px] text-muted py-1.5">Ninguna marca coincide con “{brandSearch}”.</p>
            ) : (
              <ul id="catalog-brand-list">
                {visibleBrands.map((brand) => (
                  <li key={brand.id}>
                    <FilterCheckbox
                      checked={currentBrands.includes(brand.slug)}
                      onChange={() => go({ brand: toggle(currentBrands, brand.slug) })}
                      label={brand.name}
                      count={facets.brands[brand.id] ?? 0}
                    />
                  </li>
                ))}
              </ul>
            )}
            {!query && matchingBrands.length > BRANDS_VISIBLE && (
              <button
                type="button"
                aria-expanded={brandsExpanded}
                aria-controls="catalog-brand-list"
                onClick={() => setBrandsExpanded((v) => !v)}
                className="mt-1.5 min-h-8 text-[12px] font-semibold text-accent-ink hover:underline underline-offset-4"
              >
                {brandsExpanded ? 'Ver menos' : `Ver más (${hiddenBrands})`}
              </button>
            )}
          </FilterGroup>
        )}

        <FilterGroup id="precio" label="Precio" open={openGroups.has('precio')} onToggle={toggleGroup}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              applyPrice()
            }}
          >
            <div className="grid grid-cols-2 gap-2 mb-3">
              <PriceInput
                id="price-min"
                label="Precio mínimo en soles"
                placeholder="Mín"
                value={priceDraft.min}
                onChange={(v) => setPriceDraft((d) => ({ ...d, min: v }))}
              />
              <PriceInput
                id="price-max"
                label="Precio máximo en soles"
                placeholder="Máx"
                value={priceDraft.max}
                onChange={(v) => setPriceDraft((d) => ({ ...d, max: v }))}
              />
            </div>
            <button
              type="submit"
              className="w-full border border-(--bd) text-text font-display text-[12px] font-bold tracking-[1px] uppercase py-2 mb-3 hover:border-(--gold) hover:text-accent-ink transition-colors"
            >
              Aplicar
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map(([min, max, label]) => {
              const active = priceMin === min && priceMax === max
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setPriceDraft({ min: min?.toString() ?? '', max: max?.toString() ?? '' })
                    go({ priceMin: min, priceMax: max })
                  }}
                  className={cn(
                    'border text-[11px] px-2.5 py-1.5 transition-colors',
                    active
                      ? 'border-(--bdh) bg-(--gd) text-accent-ink'
                      : 'border-(--bd) text-muted hover:border-muted hover:text-text',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </FilterGroup>

        <FilterGroup
          id="disponibilidad"
          label="Disponibilidad"
          open={openGroups.has('disponibilidad')}
          onToggle={toggleGroup}
          last
        >
          <ul>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <FilterCheckbox
                  checked={currentAvail.includes(opt.value)}
                  onChange={() => go({ avail: toggle(currentAvail, opt.value) })}
                  label={opt.label}
                  count={facets.availability[opt.value] ?? 0}
                />
              </li>
            ))}
          </ul>
        </FilterGroup>
      </div>
    </aside>
  )
}

function PriceInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span
        aria-hidden
        className="absolute left-2.5 top-1/2 -translate-y-1/2 font-display text-[13px] font-bold text-muted"
      >
        S/
      </span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card border border-field text-text font-display text-[14px] font-bold pl-7 pr-2 py-2 outline-none focus-visible:border-accent-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      />
    </div>
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
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        aria-controls={`filter-group-${id}`}
        className="w-full flex items-center justify-between px-5 py-3.5 font-display text-[15px] font-extrabold uppercase tracking-[0.5px] text-text hover:text-accent-ink transition-colors"
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden
          className={cn('text-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      <div id={`filter-group-${id}`} hidden={!open} className="px-5 pb-4">
        {children}
      </div>
    </div>
  )
}

function FilterCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  count,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
  count?: number
}) {
  // Checkbox nativo `sr-only peer`: el <span> es solo la caja visual. El
  // estado indeterminado no existe como atributo HTML: se fija por ref, y el
  // lector de pantalla lo anuncia como "parcialmente marcado".
  // Una opción con 0 resultados se deshabilita salvo que ya esté marcada
  // (si no, no se podría desmarcar).
  const disabled = count === 0 && !checked && !indeterminate
  const marked = checked || indeterminate
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 py-1.5 min-h-8 group',
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
        }}
        onChange={onChange}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={cn(
          'w-4 h-4 shrink-0 border flex items-center justify-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
          marked ? 'bg-(--gold) border-(--gold)' : 'border-field bg-transparent',
        )}
      >
        {checked && <Check size={10} className="text-on-accent" strokeWidth={3} />}
        {!checked && indeterminate && <Minus size={10} className="text-on-accent" strokeWidth={3} />}
      </span>
      <span
        className={cn(
          'flex-1 text-[13px] transition-colors',
          marked ? 'text-text' : 'text-muted',
          !disabled && 'group-hover:text-text',
        )}
      >
        {label}
      </span>
      {count != null && (
        <span className="text-[11px] tabular-nums text-muted">
          {count}
          <span className="sr-only"> productos</span>
        </span>
      )}
    </label>
  )
}
