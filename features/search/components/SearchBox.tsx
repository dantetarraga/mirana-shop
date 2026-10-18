'use client'

import { getSearchSuggestions, type SearchSuggestions } from '@/features/search/actions/search.actions'
import { useRecentSearchesStore } from '@/features/search/stores/recent-searches.store'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { getCategoryStripe, type CatalogProduct } from '@/features/products/types/catalog.types'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { cn, formatCurrency } from '@/shared/lib/utils'
import { ArrowRight, Clock, History, Search, SearchX, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { startNavigationProgress } from '@/shared/components/layout/NavigationProgress'
import { useEffect, useId, useRef, useState } from 'react'

const EMPTY_SUGGESTIONS: SearchSuggestions = { query: '', products: [], categories: [], total: 0 }

/** Etiqueta de estado de una sugerencia. `null` = disponible, no hace falta. */
function suggestionTag(p: CatalogProduct): string | null {
  if (p.status === 'PREORDER') return 'Preventa'
  if (p.status === 'SOLD_OUT' || p.stock === 0) return 'Agotado'
  return null
}

/**
 * Una opción navegable del combobox. Todas las filas del listbox (productos,
 * categorías, "ver todo") se aplanan en esta lista para que ArrowUp/Down
 * recorra el desplegable en el mismo orden en que se ve.
 */
type Option =
  | { kind: 'product'; key: string; product: CatalogProduct }
  | { kind: 'category'; key: string; id: string; slug: string; name: string; productCount: number }
  | { kind: 'all'; key: string }

interface SearchBoxProps {
  /** Enfoca el input al montar (buscador desplegable del navbar móvil). */
  focusOnMount?: boolean
  /** Escape con el desplegable ya cerrado — el navbar móvil cierra la fila. */
  onDismiss?: () => void
  /** Se eligió un resultado (antes de navegar). */
  onNavigate?: () => void
  className?: string
}

export function SearchBox({
  focusOnMount = false,
  onDismiss,
  onNavigate,
  className,
}: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [data, setData] = useState<SearchSuggestions>(EMPTY_SUGGESTIONS)
  const debouncedQuery = useDebounce(query, 300)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)
  const router = useRouter()
  const recentTerms = useRecentSearchesStore((s) => s.terms)
  const addTerm = useRecentSearchesStore((s) => s.addTerm)
  const removeTerm = useRecentSearchesStore((s) => s.removeTerm)
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = (i: number) => `${baseId}-opt-${i}`

  useEffect(() => {
    const id = ++requestId.current
    getSearchSuggestions(debouncedQuery).then((result) => {
      if (id === requestId.current) setData(result)
    })
  }, [debouncedQuery])

  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus()
  }, [focusOnMount])

  // `loading` derivado en render: mientras el resultado no corresponda a la
  // búsqueda debounced en curso, seguimos cargando. Evita un setState síncrono
  // dentro del efecto (cascada de render).
  const trimmedDebounced = debouncedQuery.trim()
  const loading = trimmedDebounced.length >= 2 && data.query !== trimmedDebounced

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function close() {
    setOpen(false)
    setActiveIndex(-1)
  }

  function goToResults(term: string) {
    const clean = term.trim()
    if (!clean) return
    addTerm(clean)
    close()
    onNavigate?.()
    startNavigationProgress()
    router.push(`/catalogo?q=${encodeURIComponent(clean)}`)
  }

  function goToProduct(slug: string, term: string) {
    if (term.trim()) addTerm(term.trim())
    close()
    onNavigate?.()
    startNavigationProgress()
    router.push(`/catalogo/${slug}`)
  }

  function goToCategory(slug: string, term: string) {
    if (term.trim()) addTerm(term.trim())
    close()
    onNavigate?.()
    startNavigationProgress()
    router.push(`/categorias/${slug}`)
  }

  const showIdle = query.trim().length < 2
  const hasResults = !showIdle && data.products.length > 0
  const hasNoResults =
    !showIdle && !loading && data.products.length === 0 && data.query === debouncedQuery.trim()

  const categoryOptions: Option[] = data.categories.map((c) => ({
    kind: 'category',
    key: `c-${c.id}`,
    id: c.id,
    slug: c.slug,
    name: c.name,
    productCount: c.productCount,
  }))
  const options: Option[] = showIdle
    ? categoryOptions
    : hasResults
      ? [
          ...data.products.map((p) => ({ kind: 'product' as const, key: `p-${p.id}`, product: p })),
          ...categoryOptions,
          { kind: 'all' as const, key: 'all' },
        ]
      : []

  // Un índice que quedó fuera de rango (cambió la lista) se trata como "ninguno".
  const active = activeIndex >= 0 && activeIndex < options.length ? activeIndex : -1

  function activate(opt: Option) {
    if (opt.kind === 'product') goToProduct(opt.product.slug, query)
    else if (opt.kind === 'category') goToCategory(opt.slug, showIdle ? opt.name : query)
    else goToResults(query)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        if (!open) setOpen(true)
        if (options.length > 0) setActiveIndex((active + 1) % options.length)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (!open) setOpen(true)
        if (options.length > 0) setActiveIndex(active <= 0 ? options.length - 1 : active - 1)
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (open && active >= 0) activate(options[active])
        else goToResults(query)
        break
      }
      case 'Escape': {
        if (open) {
          e.preventDefault()
          close()
        } else if (query) {
          setQuery('')
        } else {
          onDismiss?.()
        }
        break
      }
      case 'Tab':
        close()
        break
    }
  }

  // Scroll del ítem activo a la vista cuando se navega con teclado.
  useEffect(() => {
    if (active < 0) return
    document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, baseId])

  const groupHeader =
    "text-[11px] font-bold tracking-[2px] uppercase text-muted px-4.5 pb-2 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-(--bd)"

  const optionCls = (i: number) =>
    cn(
      'flex items-center gap-3.5 px-4.5 py-2.5 w-full text-left cursor-pointer transition-colors',
      i === active ? 'bg-(--sub)' : 'hover:bg-(--sub)',
    )

  // Las opciones no son focusables: el foco se queda en el input y el lector
  // sigue la opción activa por `aria-activedescendant`. `onMouseDown` evita
  // que el click robe el foco (y cierre el desplegable) antes del onClick.
  const optionProps = (i: number, opt: Option) => ({
    id: optionId(i),
    role: 'option' as const,
    'aria-selected': i === active,
    tabIndex: -1,
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    onMouseEnter: () => setActiveIndex(i),
    onClick: () => activate(opt),
  })

  // Índices planos: en reposo solo hay categorías; con resultados van
  // productos, luego categorías y al final "ver todo" — el orden visual.
  const categoryOffset = showIdle ? 0 : data.products.length
  const allIndex = data.products.length + categoryOptions.length

  const renderCategory = (opt: Extract<Option, { kind: 'category' }>, ci: number, compact: boolean) => {
    const i = categoryOffset + ci
    return (
      <li key={opt.key} {...optionProps(i, opt)} className={optionCls(i)}>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-display uppercase text-text',
              compact ? 'text-[14px] font-bold' : 'text-[15px] font-extrabold tracking-[-0.3px]',
            )}
          >
            {opt.name}
          </div>
          {!compact && <div className="text-[11px] text-muted mt-0.5">{opt.productCount} productos</div>}
        </div>
        {compact ? (
          <span className="text-[11px] text-muted">{opt.productCount} productos</span>
        ) : (
          <ArrowRight size={13} className="text-muted shrink-0" aria-hidden />
        )}
      </li>
    )
  }

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          goToResults(query)
        }}
        className={`flex items-center gap-2 h-11 pl-4 pr-1 bg-surf border transition-colors duration-200 ${open ? 'border-(--gold)' : 'border-(--bd)'}`}
      >
        <Search size={17} className="shrink-0 text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
            // Escribir siempre reabre. Enter y Escape cierran el desplegable
            // pero dejan el foco dentro del input, así que onFocus ya no
            // vuelve a dispararse.
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar figura, marca…"
          autoComplete="off"
          aria-label="Buscar productos"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          // 16px: con menos, Safari iOS hace zoom al enfocar
          className="flex-1 min-w-0 w-full bg-transparent border-none outline-none font-sans text-base sm:text-[14px] text-text placeholder:text-muted placeholder:truncate [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="shrink-0 w-11 h-10 flex items-center justify-center text-muted hover:text-text transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </form>

      {/* Anuncia el nº de resultados a lectores de pantalla sin recargar foco. */}
      <div className="sr-only" role="status" aria-live="polite">
        {open && hasResults ? `${data.total} resultados para ${query}` : ''}
        {open && hasNoResults ? `Sin resultados para ${query}` : ''}
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-250 bg-surf border border-(--bd) shadow-pop max-h-[70vh] overflow-y-auto overscroll-contain">
          {/* Recientes: fuera del listbox — cada chip tiene dos botones (usar y
              quitar) y un listbox solo puede contener opciones. */}
          {showIdle && recentTerms.length > 0 && (
            <div className="py-3.5">
              <div className={groupHeader}>
                <History size={11} aria-hidden /> Recientes
              </div>
              <div className="flex flex-wrap gap-2 px-4.5">
                {recentTerms.map((term) => (
                  <div
                    key={term}
                    className="flex items-center border border-(--bd) text-muted text-[12px] hover:text-text hover:border-muted transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term)
                        inputRef.current?.focus()
                      }}
                      className="flex items-center gap-1.5 pl-3 pr-1 min-h-9"
                    >
                      <Clock size={11} className="opacity-50" aria-hidden />
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTerm(term)}
                      aria-label={`Quitar "${term}" de búsquedas recientes`}
                      className="w-9 min-h-9 flex items-center justify-center opacity-60 hover:opacity-100"
                    >
                      <X size={12} aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ul id={listboxId} role="listbox" aria-label="Sugerencias de búsqueda">
            {showIdle && categoryOptions.length > 0 && (
              <li role="presentation" className="py-3.5">
                <div className={groupHeader} aria-hidden>
                  Categorías populares
                </div>
                <ul role="group" aria-label="Categorías populares">
                  {categoryOptions.map((opt, ci) =>
                    renderCategory(opt as Extract<Option, { kind: 'category' }>, ci, false),
                  )}
                </ul>
              </li>
            )}

            {!showIdle && hasResults && (
              <>
                <li role="presentation" className="py-3.5">
                  <div className={groupHeader} aria-hidden>
                    Coincidencias
                  </div>
                  <ul role="group" aria-label="Productos">
                    {data.products.map((p, i) => {
                      const opt: Option = { kind: 'product', key: `p-${p.id}`, product: p }
                      const tag = suggestionTag(p)
                      return (
                        <li key={opt.key} {...optionProps(i, opt)} className={cn(optionCls(i), 'group')}>
                          <div
                            className={`w-9 h-9 shrink-0 border border-(--bd) ${getCategoryStripe(p.category.slug)}`}
                          >
                            {p.imageUrl && (
                              <Image
                                src={p.imageUrl}
                                alt=""
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                'font-display text-[15px] font-extrabold uppercase tracking-[-0.3px] truncate',
                                i === active ? 'text-accent-ink' : 'text-text group-hover:text-accent-ink',
                              )}
                            >
                              {p.name}
                            </div>
                            <div className="text-[11px] text-muted mt-0.5 truncate flex items-center gap-1.5">
                              <span className="truncate">
                                {p.category.name} · {p.brand.name}
                              </span>
                              {/* Sin esta marca, una preventa o un agotado se
                                  leerían como stock normal. */}
                              {tag && (
                                <span className="shrink-0 text-[11px] font-extrabold tracking-[1px] uppercase px-1.5 py-0.5 border border-(--bd) text-muted">
                                  {tag}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="font-display text-[16px] font-black text-accent-ink shrink-0">
                            {formatCurrency(effectivePrice(p))}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </li>

                {categoryOptions.length > 0 && (
                  <li role="presentation" className="py-3.5">
                    <div className={groupHeader} aria-hidden>
                      Categorías
                    </div>
                    <ul role="group" aria-label="Categorías">
                      {categoryOptions.map((opt, ci) =>
                        renderCategory(opt as Extract<Option, { kind: 'category' }>, ci, true),
                      )}
                    </ul>
                  </li>
                )}

                {(() => {
                  const opt: Option = { kind: 'all', key: 'all' }
                  return (
                    <li
                      {...optionProps(allIndex, opt)}
                      className={cn(
                        'px-4.5 py-3 border-t border-(--bd) flex items-center justify-between gap-3 cursor-pointer',
                        allIndex === active ? 'bg-(--sub)' : 'hover:bg-(--sub)',
                      )}
                    >
                      <span className="text-[12px] text-muted">
                        {data.total} resultado{data.total === 1 ? '' : 's'} para &quot;{query}&quot;
                      </span>
                      <span className="inline-flex items-center gap-1.5 border border-(--bd) text-text font-display text-[13px] font-bold tracking-[1px] uppercase px-4 py-1.5">
                        Ver todo <ArrowRight size={12} aria-hidden />
                      </span>
                    </li>
                  )
                })()}
              </>
            )}
          </ul>

          {hasNoResults && (
            <div className="py-8 px-4.5 text-center text-muted">
              <SearchX size={36} className="opacity-20 mb-2.5 mx-auto" aria-hidden />
              <div className="text-[14px]">
                Sin resultados para &quot;<strong>{query}</strong>&quot;
              </div>
              {data.categories.length > 0 && (
                <>
                  <div className="text-[12px] text-muted mt-1.5">Intenta con estos términos:</div>
                  <div className="flex gap-2 flex-wrap justify-center mt-3.5">
                    {data.categories.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          setQuery(cat.name)
                          inputRef.current?.focus()
                        }}
                        className="bg-(--gd) border border-(--bd) text-accent-ink text-[12px] px-3 min-h-9 hover:bg-(--sub) transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
