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
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { cls } from '@/shared/lib/admin/admin-classes'
import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

/** Placeholder del segundo desplegable según el tipo de destino elegido */
const PICK_LABELS: Record<string, string> = {
  category: 'Elige una categoría',
  brand: 'Elige una marca',
  collection: 'Elige una colección',
}

interface LinkPickerProps {
  /** href actual (lo que se guarda en BD). */
  value: string
  onChange: (href: string) => void
}

// ---------------------------------------------------------------------------
// Selector de destino para los CTA de marketing: el admin elige categoría,
// marca, colección o producto y aquí se arma la URL del storefront. La opción
// "URL personalizada" sigue disponible para enlaces externos o rutas sueltas.
//
// Los desplegables son el FilterMultiSelect del admin (modo `singleSelect`),
// el mismo de Estado y de los filtros de listado: así el formulario no mezcla
// el desplegable nativo del navegador con el del resto del panel.
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

  const [options, setOptions] = useState<LinkTargetOptions>({
    categories: [],
    brands: [],
    collections: [],
  })
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

  // Los tres destinos de lista comparten desplegable; solo cambia de dónde
  // salen las opciones. El hint va dentro de la etiqueta porque el desplegable
  // del admin pinta una sola línea por opción.
  const isListType = type === 'category' || type === 'brand' || type === 'collection'
  const list =
    type === 'category'
      ? options.categories
      : type === 'brand'
        ? options.brands
        : type === 'collection'
          ? options.collections
          : []

  const listOptions = list.map((o) => ({
    value: o.value,
    label: o.hint ? `${o.label} · ${o.hint}` : o.label,
  }))

  return (
    <div className="flex flex-col gap-2">
      <FilterMultiSelect
        singleSelect
        label="Destino"
        className="w-full"
        options={LINK_TARGET_TYPES.map((t) => ({ value: t, label: LINK_TARGET_LABELS[t] }))}
        selected={[type]}
        onToggle={(val) => changeType(val as LinkTargetType)}
      />

      {isListType && (
        <FilterMultiSelect
          singleSelect
          label={PICK_LABELS[type] ?? 'Elige una opción'}
          className="w-full"
          options={listOptions}
          selected={target ? [target] : []}
          onToggle={(val) => emit(type, val)}
        />
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
