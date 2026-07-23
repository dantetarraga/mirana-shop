'use client'

import {
  getLinkProduct,
  getLinkTargetOptions,
  searchLinkProducts,
  type LinkOption,
  type LinkTargetOptions,
} from '@/features/marketing/actions/link-target.actions'
import {
  LINK_TARGET_LABELS,
  LINK_TARGET_TYPES,
  buildLinkHref,
  parseLinkHref,
  type LinkTargetType,
} from '@/features/marketing/lib/link-target'
import { Select } from '@/shared/components/ui/Select'
import { cls } from '@/shared/lib/admin/admin-classes'
import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

interface LinkPickerProps {
  /** href actual (lo que se guarda en BD). */
  value: string
  onChange: (href: string) => void
}

// ---------------------------------------------------------------------------
// Selector de destino para los CTA de marketing: el admin elige categoría,
// marca o producto y aquí se arma la URL del storefront. La opción "URL
// personalizada" sigue disponible para enlaces externos o rutas sueltas.
// ---------------------------------------------------------------------------

export function LinkPicker({ value, onChange }: LinkPickerProps) {
  const parsed = parseLinkHref(value)

  // El tipo no siempre se deduce del href: elegir "Categoría" antes de escoger
  // cuál deja el href vacío (que parsearía como "Sin enlace"). Por eso se
  // recuerda la última elección explícita mientras el href siga siendo el que
  // ella produjo — si el formulario carga otro valor, manda el parseo.
  const [choice, setChoice] = useState<{ href: string; type: LinkTargetType } | null>(null)
  const type = choice?.href === value ? choice.type : parsed.type
  const target = type === 'custom' ? value : type === parsed.type ? parsed.value : ''

  const [options, setOptions] = useState<LinkTargetOptions>({ categories: [], brands: [] })
  const [product, setProduct] = useState<LinkOption | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LinkOption[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTerm = useRef('')

  useEffect(() => {
    getLinkTargetOptions().then((r) => {
      if (r.success) setOptions(r.data)
    })
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  // Nombre del producto ya enlazado (al editar solo llega el slug).
  const productSlug = type === 'product' ? target : ''
  useEffect(() => {
    if (!productSlug || product?.value === productSlug) return
    let alive = true
    getLinkProduct(productSlug).then((r) => {
      if (alive && r.success) setProduct(r.data)
    })
    return () => {
      alive = false
    }
  }, [productSlug, product])

  const emit = (nextType: LinkTargetType, nextTarget: string) => {
    const href = buildLinkHref({ type: nextType, value: nextTarget })
    setChoice({ href, type: nextType })
    onChange(href)
  }

  const changeType = (nextType: LinkTargetType) => {
    setQuery('')
    setResults([])
    if (nextType !== 'product') setProduct(null)
    emit(nextType, '')
  }

  // Debounce en el propio evento (no en un efecto) para no encadenar renders.
  const changeQuery = (next: string) => {
    setQuery(next)
    if (timer.current) clearTimeout(timer.current)

    const term = next.trim()
    lastTerm.current = term
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    timer.current = setTimeout(() => {
      searchLinkProducts(term).then((r) => {
        if (lastTerm.current !== term) return // llegó una búsqueda más nueva
        setResults(r.success ? r.data : [])
        setSearching(false)
      })
    }, SEARCH_DEBOUNCE_MS)
  }

  const pickProduct = (option: LinkOption) => {
    setProduct(option)
    setQuery('')
    setResults([])
    emit('product', option.value)
  }

  const list = type === 'category' ? options.categories : options.brands

  return (
    <div className="flex flex-col gap-2">
      <Select value={type} onChange={(e) => changeType(e.target.value as LinkTargetType)}>
        {LINK_TARGET_TYPES.map((t) => (
          <option key={t} value={t}>
            {LINK_TARGET_LABELS[t]}
          </option>
        ))}
      </Select>

      {(type === 'category' || type === 'brand') && (
        <Select value={target} onChange={(e) => emit(type, e.target.value)}>
          <option value="">
            {type === 'category' ? '— Elige una categoría —' : '— Elige una marca —'}
          </option>
          {list.map((o) => (
            <option key={o.value} value={o.value}>
              {o.hint ? `${o.label} · ${o.hint}` : o.label}
            </option>
          ))}
        </Select>
      )}

      {type === 'product' &&
        (product && product.value === target ? (
          <div className="flex items-center gap-2.5 border border-(--bd) bg-card px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] truncate">{product.label}</div>
              {product.hint && <div className={cls.mono}>{product.hint}</div>}
            </div>
            <button
              type="button"
              onClick={() => emit('product', '')}
              className="text-muted hover:text-text transition-colors shrink-0"
              aria-label="Quitar producto"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                className={`${cls.input} pl-9`}
                placeholder="Buscar producto por nombre o SKU…"
              />
              {searching && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin"
                />
              )}
            </div>

            {results.length > 0 && (
              <div className="border border-(--bd) border-t-0 bg-card max-h-52 overflow-y-auto">
                {results.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => pickProduct(o)}
                    className="w-full text-left px-3 py-2 hover:bg-(--sub) transition-colors"
                  >
                    <div className="text-[13px] truncate">{o.label}</div>
                    {o.hint && <div className={cls.mono}>{o.hint}</div>}
                  </button>
                ))}
              </div>
            )}

            {!searching && results.length === 0 && query.trim().length >= MIN_QUERY_LENGTH && (
              <p className="mt-1 text-[11px] text-muted">Sin resultados</p>
            )}
          </div>
        ))}

      {type === 'custom' && (
        <input
          value={target}
          onChange={(e) => emit('custom', e.target.value)}
          className={cls.input}
          placeholder="/catalogo?cat=figuras o https://…"
        />
      )}

      <p className={cls.mono}>
        {value ? `Enlaza a ${value}` : 'El botón no se mostrará hasta elegir un destino'}
      </p>
    </div>
  )
}
