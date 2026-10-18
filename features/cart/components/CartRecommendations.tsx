'use client'

import { getCartRecommendationsAction } from '@/features/cart/actions/recommendations.actions'
import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { productCartKind } from '@/features/cart/lib/cart-kind'
import {
  createTtlCache,
  RECOMMENDATIONS_TTL_MS,
  recommendationsCacheKey,
} from '@/features/cart/lib/recommendations-cache'
import { useCartStore } from '@/features/cart/stores/cart.store'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { FadeImage } from '@/shared/components/ui/FadeImage'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { cn, formatCurrency } from '@/shared/lib/utils'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'

// ---------------------------------------------------------------------------
// "También te puede gustar" — recomendaciones del último producto agregado.
//
// Escritorio: columna a la izquierda del drawer (el drawer se ensancha a dos
// columnas). Móvil: carrusel horizontal con snap, debajo de las líneas.
// Las dos variantes leen el mismo resultado de `useCartRecommendations`.
// ---------------------------------------------------------------------------

/**
 * Caché de sesión: reabrir el drawer tras agregar el mismo producto con el
 * mismo carrito no vuelve a llamar a la action. La clave incluye tipo de
 * carrito y lo excluido, y las entradas caducan (ver `recommendations-cache`).
 */
const recommendationsCache = createTtlCache<Promise<CatalogProduct[]>>(RECOMMENDATIONS_TTL_MS)

function loadRecommendations(anchor: CatalogProduct): Promise<CatalogProduct[]> {
  // Lo que había en el carrito al pedirlas. Lo que se agregue después desde
  // el propio panel se queda en la lista marcado como "Agregado".
  const excludeIds = useCartStore.getState().cart.map((i) => i.product.id)
  const kind = productCartKind(anchor)
  const key = recommendationsCacheKey(anchor.id, kind, excludeIds)
  const cached = recommendationsCache.get(key)
  if (cached) return cached

  const promise = getCartRecommendationsAction({
    productId: anchor.id,
    categorySlug: anchor.category.slug,
    brandSlug: anchor.brand.slug,
    excludeIds,
    kind,
  }).catch(() => {
    // Sin recomendaciones no se rompe nada: el panel simplemente no aparece.
    // Se saca de la caché para reintentar en la próxima apertura.
    recommendationsCache.delete(key)
    return []
  })
  recommendationsCache.set(key, promise)
  return promise
}

export type RecommendationsState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'ready'; items: CatalogProduct[] }

/** Recomendaciones del último agregado. `none` = no hay ancla o no hay nada que recomendar. */
export function useCartRecommendations(): RecommendationsState {
  const anchor = useCartStore((s) => s.lastAdded)
  const [result, setResult] = useState<{ id: string; items: CatalogProduct[] } | null>(null)

  useEffect(() => {
    if (!anchor) return
    let alive = true
    loadRecommendations(anchor).then((items) => {
      if (alive) setResult({ id: anchor.id, items })
    })
    return () => {
      alive = false
    }
  }, [anchor])

  if (!anchor) return { status: 'none' }
  if (result?.id !== anchor.id) return { status: 'loading' }
  if (result.items.length === 0) return { status: 'none' }
  return { status: 'ready', items: result.items }
}

// ---------------------------------------------------------------------------
// Tarjeta
// ---------------------------------------------------------------------------

interface RecommendationCardProps {
  product: CatalogProduct
  onNavigate: () => void
  layout: 'column' | 'strip'
}

function RecommendationCard({ product, onNavigate, layout }: RecommendationCardProps) {
  const addToCart = useCartStore((s) => s.addToCart)
  const { product: p, isPreorder, unitPrice, hasDiscount, ctaState } = useCartLine(product)
  const href = `/catalogo/${p.slug}`
  const inCart = ctaState === 'in-cart'
  const column = layout === 'column'

  return (
    <li
      className={cn(
        'flex gap-3',
        column ? 'flex-row items-start' : 'flex-col w-38 shrink-0 snap-start',
      )}
    >
      <Link
        href={href}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
        className={cn(
          'relative block shrink-0 overflow-hidden',
          getCategoryStripe(p.category.slug),
          column ? 'w-20 aspect-[4/5]' : 'w-full aspect-[4/5]',
        )}
      >
        {p.imageUrl && (
          <FadeImage
            src={p.imageUrl}
            alt=""
            fill
            sizes={column ? '80px' : '152px'}
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <Link
          href={href}
          onClick={onNavigate}
          className="text-[13px] font-semibold leading-snug line-clamp-2 hover:text-accent-ink transition-colors duration-150"
        >
          {p.name}
        </Link>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-display text-[17px] font-black text-accent-ink leading-none">
            {hasDiscount && <span className="sr-only">Precio de oferta: </span>}
            {formatCurrency(unitPrice)}
          </span>
          {hasDiscount && (
            <del className="text-[12px] text-muted">
              <span className="sr-only">Precio anterior: </span>
              {formatCurrency(p.price)}
            </del>
          )}
        </div>
        <Button
          variant={inCart ? 'success' : 'outline'}
          size="sm"
          // Mismo criterio que el botón del PDP: "Agregado" es un estado, no un
          // botón inhabilitado (con `disabled` se pintaría al 40 %).
          disabled={ctaState === 'out-of-stock' || ctaState === 'capped' || ctaState === 'loading'}
          aria-disabled={inCart || undefined}
          aria-label={
            inCart
              ? `${p.name} ya está en el carrito`
              : `${isPreorder ? 'Reservar' : 'Agregar'} ${p.name} al carrito`
          }
          className={cn('mt-1 min-h-11 w-full px-3', inCart && 'cursor-default')}
          onClick={() => {
            if (ctaState !== 'idle') return
            // Sin abrir ni reanclar: el drawer ya está abierto y la lista que el
            // cliente está mirando no debe cambiar bajo su dedo.
            addToCart(p, 1, 'FULL', { openDrawer: false })
          }}
        >
          {inCart ? (
            <>
              <Check size={14} strokeWidth={3} aria-hidden />
              Agregado
            </>
          ) : isPreorder ? (
            'Reservar'
          ) : (
            'Agregar'
          )}
        </Button>
      </div>
    </li>
  )
}

function RecommendationCardSkeleton({ layout }: { layout: 'column' | 'strip' }) {
  const column = layout === 'column'
  return (
    <li
      aria-hidden
      className={cn('flex gap-3', column ? 'flex-row' : 'flex-col w-38 shrink-0')}
    >
      <Skeleton className={column ? 'w-20 aspect-[4/5] shrink-0' : 'w-full aspect-[4/5]'} />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-16 mt-1" />
        <Skeleton className="h-11 w-full mt-1" />
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Variantes de layout
// ---------------------------------------------------------------------------

interface RecommendationsProps {
  state: RecommendationsState
  onNavigate: () => void
}

const SKELETON_COUNT = 3

function RecommendationsList({
  state,
  onNavigate,
  layout,
  className,
}: RecommendationsProps & { layout: 'column' | 'strip'; className?: string }) {
  if (state.status === 'none') return null
  return (
    <ul className={className}>
      {state.status === 'loading'
        ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <RecommendationCardSkeleton key={i} layout={layout} />
          ))
        : state.items.map((p) => (
            <RecommendationCard key={p.id} product={p} onNavigate={onNavigate} layout={layout} />
          ))}
    </ul>
  )
}

/** Columna izquierda del drawer — solo escritorio (lg+). */
export function CartRecommendationsColumn({ state, onNavigate }: RecommendationsProps) {
  const titleId = useId()
  if (state.status === 'none') return null
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={state.status === 'loading' || undefined}
      className="hidden lg:flex flex-col w-75 shrink-0 border-r border-(--bd) bg-bg min-h-0"
    >
      <h3
        id={titleId}
        className="px-6 pt-7 pb-4 font-display text-[18px] font-black uppercase tracking-[0.5px]"
      >
        También te puede gustar
      </h3>
      <RecommendationsList
        state={state}
        onNavigate={onNavigate}
        layout="column"
        className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 flex flex-col gap-5"
      />
    </section>
  )
}

/** Carrusel horizontal debajo de las líneas — móvil y tablet (< lg). */
export function CartRecommendationsStrip({ state, onNavigate }: RecommendationsProps) {
  const titleId = useId()
  if (state.status === 'none') return null
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={state.status === 'loading' || undefined}
      className="lg:hidden pt-2"
    >
      <h3
        id={titleId}
        className="font-display text-[16px] font-black uppercase tracking-[0.5px] mb-3"
      >
        También te puede gustar
      </h3>
      {/* Sangra hasta el borde del drawer para que se note que hay más a la
          derecha; el padding interno conserva la alineación del contenido. */}
      <RecommendationsList
        state={state}
        onNavigate={onNavigate}
        layout="strip"
        className="-mx-5 sm:-mx-7 px-5 sm:px-7 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-5 sm:scroll-px-7 overscroll-x-contain pb-2 [scrollbar-width:none]"
      />
    </section>
  )
}
