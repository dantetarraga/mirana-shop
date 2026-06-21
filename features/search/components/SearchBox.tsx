'use client'

import { getSearchSuggestions, type SearchSuggestions } from '@/features/search/actions/search.actions'
import { useRecentSearchesStore } from '@/features/search/stores/recent-searches.store'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { useDebounce } from '@/shared/hooks'
import { Clock, History, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const EMPTY_SUGGESTIONS: SearchSuggestions = { query: '', products: [], categories: [], total: 0 }

export function SearchBox() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<SearchSuggestions>(EMPTY_SUGGESTIONS)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const wrapRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)
  const router = useRouter()
  const { terms: recentTerms, addTerm, removeTerm } = useRecentSearchesStore()

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    getSearchSuggestions(debouncedQuery).then((result) => {
      if (id === requestId.current) {
        setData(result)
        setLoading(false)
      }
    })
  }, [debouncedQuery])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function goToResults(term: string) {
    const clean = term.trim()
    if (!clean) return
    addTerm(clean)
    setOpen(false)
    router.push(`/catalogo?q=${encodeURIComponent(clean)}`)
  }

  function goToProduct(slug: string, term: string) {
    if (term.trim()) addTerm(term.trim())
    setOpen(false)
    router.push(`/catalogo/${slug}`)
  }

  function goToCategory(slug: string, term: string) {
    if (term.trim()) addTerm(term.trim())
    setOpen(false)
    router.push(`/catalogo?cat=${slug}`)
  }

  const showIdle = query.trim().length < 2
  const hasResults = !showIdle && data.products.length > 0
  const hasNoResults = !showIdle && !loading && data.products.length === 0 && data.query === debouncedQuery.trim()

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`flex items-center gap-3 h-11 px-4 bg-surf border transition-colors duration-200 ${open ? 'border-(--gold)' : 'border-(--bd)'}`}
      >
        <Search size={17} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToResults(query)
          }}
          placeholder="Buscar figura, marca, categoría…"
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none font-sans text-[14px] text-text placeholder:text-muted"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="shrink-0 text-muted hover:text-text transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-250 bg-surf border border-(--bd) shadow-[0_16px_48px_rgba(0,0,0,.4)] max-h-[70vh] overflow-y-auto">
          {showIdle && (
            <>
              {recentTerms.length > 0 && (
                <div className="py-3.5">
                  <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted px-4.5 pb-2 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-(--bd)">
                    <History size={11} /> Recientes
                  </div>
                  <div className="flex flex-wrap gap-2 px-4.5">
                    {recentTerms.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="flex items-center gap-1.5 border border-(--bd) text-muted text-[12px] px-3 py-1.5 hover:text-text hover:border-muted transition-colors"
                      >
                        <Clock size={11} className="opacity-50" />
                        {term}
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTerm(term)
                          }}
                          className="ml-1 opacity-50 hover:opacity-100"
                        >
                          <X size={11} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="py-3.5">
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted px-4.5 pb-2 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-(--bd)">
                  Categorías populares
                </div>
                {data.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => goToCategory(cat.slug, cat.name)}
                    className="flex items-center gap-3.5 px-4.5 py-2.5 w-full text-left hover:bg-(--sub) transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] font-extrabold uppercase tracking-[-0.3px] text-text">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">{cat.productCount} productos</div>
                    </div>
                    <span className="text-muted text-[13px]">→</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {!showIdle && hasResults && (
            <>
              <div className="py-3.5">
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted px-4.5 pb-2 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-(--bd)">
                  Coincidencias
                </div>
                {data.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => goToProduct(p.slug, query)}
                    className="flex items-center gap-3.5 px-4.5 py-2.5 w-full text-left hover:bg-(--sub) transition-colors group"
                  >
                    <div
                      className={`w-9 h-9 shrink-0 border border-(--bd) ${getCategoryStripe(p.category.slug)}`}
                    >
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] font-extrabold uppercase tracking-[-0.3px] text-text truncate group-hover:text-(--gold)">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 truncate">
                        {p.category.name} · {p.brand.name}
                      </div>
                    </div>
                    <div className="font-display text-[16px] font-black text-(--gold) shrink-0">
                      S/ {p.price.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>

              {data.categories.length > 0 && (
                <div className="py-3.5">
                  <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted px-4.5 pb-2 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-(--bd)">
                    Categorías
                  </div>
                  {data.categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => goToCategory(cat.slug, query)}
                      className="flex items-center gap-3.5 px-4.5 py-2.5 w-full text-left hover:bg-(--sub) transition-colors"
                    >
                      <div className="flex-1 min-w-0 font-display text-[14px] font-bold uppercase text-text">
                        {cat.name}
                      </div>
                      <span className="text-[11px] text-muted">{cat.productCount} productos</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4.5 py-3 border-t border-(--bd) flex items-center justify-between">
                <span className="text-[12px] text-muted">
                  {data.total} resultado{data.total === 1 ? '' : 's'} para &quot;{query}&quot;
                </span>
                <Link
                  href={`/catalogo?q=${encodeURIComponent(query)}`}
                  onClick={() => addTerm(query)}
                  className="border border-(--bd) text-text font-display text-[13px] font-bold tracking-[1px] uppercase px-4 py-1.5 hover:border-(--gold) hover:text-(--gold) transition-colors"
                >
                  Ver todo →
                </Link>
              </div>
            </>
          )}

          {hasNoResults && (
            <div className="py-8 px-4.5 text-center text-muted">
              <div className="text-[36px] opacity-20 mb-2.5">◎</div>
              <div className="text-[14px]">
                Sin resultados para &quot;<strong>{query}</strong>&quot;
              </div>
              {data.categories.length > 0 && (
                <>
                  <div className="text-[12px] text-muted mt-1.5">Intenta con estos términos:</div>
                  <div className="flex gap-2 flex-wrap justify-center mt-3.5">
                    {data.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setQuery(cat.name)}
                        className="bg-(--gd) border border-[rgba(0,200,255,.2)] text-(--gold) text-[12px] px-3 py-1.5 hover:bg-(--sub) transition-colors"
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
