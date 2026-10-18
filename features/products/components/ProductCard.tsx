'use client'

import { CartCtaSkeleton } from '@/features/cart/components/CartCtaSkeleton'
import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { removeWithUndo } from '@/features/cart/lib/remove-with-undo'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { getProductBadge } from '@/features/products/lib/product-badge'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

/**
 * Ancho real de la card en cada breakpoint de los grids que la usan (home
 * 2→4 columnas, catálogo auto-fill de 220px, carrusel 2→5). Antes decía 33vw
 * entre 640 y 1024px, donde casi siempre hay 2 columnas: bajaba una imagen
 * más chica que la pintada y se veía borrosa.
 */
const DEFAULT_SIZES = '(max-width: 1023px) 50vw, (max-width: 1399px) 25vw, 350px'

interface ProductCardProps {
  product: CatalogProduct
  showBadge?: boolean
  /** @deprecated Ya no hay animación de entrada por card; se conserva por compatibilidad. */
  noAnimation?: boolean
  /** `sizes` de la imagen si el grid contenedor difiere del estándar. */
  sizes?: string
}

export function ProductCard({ product, showBadge = true, sizes = DEFAULT_SIZES }: ProductCardProps) {
  // Selectores atómicos: con `useCartStore()` CADA card de la página se
  // re-renderizaba ante cualquier cambio del carrito. Las acciones son
  // referencias estables, así que estas suscripciones no disparan nunca.
  const addToCart = useCartStore((s) => s.addToCart)
  const updateQty = useCartStore((s) => s.updateQty)
  // Disponibilidad, tope y precio salen del mismo hook que el PDP.
  const {
    product: p,
    qtyInCart,
    isPreorder,
    isOutOfStock,
    remaining,
    unitPrice,
    hasDiscount,
    preorderMode,
    ctaState,
  } = useCartLine(product)
  const loading = ctaState === 'loading'
  const stripe = getCategoryStripe(p.category.slug)
  const catLabel = p.category.name

  // Una sola badge por card, misma regla que la ficha.
  const badge = getProductBadge({ ...p, isOutOfStock })

  return (
    // Sin `animate-fade-up`: un fade por card en cada grid se leía genérico y
    // retrasaba la primera imagen visible.
    <div className="pcard">
      {/* Navegación directa al PDP (ya no hay vista rápida). El `::after`
          absoluto estira el área clicable del enlace a toda la card (`.pcard`
          es `relative`), así el precio también lleva a la ficha sin anidar los
          botones del carrito dentro del <a>, que sería HTML inválido. */}
      <Link
        href={`/catalogo/${p.slug}`}
        className="block after:absolute after:inset-0 after:content-['']"
      >
        <div className="relative">
          {/* 4:5 en vez de un alto fijo: las figuras son verticales y con
              `h-55 object-cover` se les cortaba la cabeza o la base. */}
          <div
            className={`${stripe} aspect-[4/5] flex items-center justify-center relative overflow-hidden`}
          >
            {p.imageUrl ? (
              <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes={sizes} />
            ) : (
              <span className="font-mono text-[11px] tracking-[2px] uppercase text-muted">
                {catLabel}
              </span>
            )}
          </div>
          {showBadge && badge && (
            <div
              className={`absolute top-3 left-0 text-[11px] font-extrabold tracking-[1.5px] uppercase px-2.5 py-1 ${badge.className}`}
            >
              {badge.label}
            </div>
          )}
        </div>

        <div className="px-4 pt-4">
          <div className="text-[11px] tracking-[2px] uppercase mb-1.25 text-muted">{catLabel}</div>
          <h3 className="font-display text-[21px] font-black uppercase leading-[1.05] mb-3 tracking-[-0.5px] line-clamp-2 min-h-11">
            {p.name}
          </h3>
        </div>
      </Link>

      {/* El precio queda bajo el `::after` (clic → ficha); los controles del
          carrito llevan `relative z-10` para quedar encima y no navegar. */}
      <div className="px-4 pb-3.5">
        <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap mb-3">
          <span className="font-display text-[20px] sm:text-[26px] font-black text-accent-ink whitespace-nowrap">
            {hasDiscount && <span className="sr-only">Precio de oferta: </span>}
            S/ {unitPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <del className="text-[12px] sm:text-[14px] font-normal text-muted whitespace-nowrap">
              <span className="sr-only">Precio anterior: </span>S/ {p.price.toFixed(2)}
            </del>
          )}
        </div>

        {loading ? (
          <CartCtaSkeleton size="md" />
        ) : ctaState === 'in-cart' && !isOutOfStock ? (
          <div className="relative z-10 flex items-center border border-(--bd) w-full">
            {qtyInCart === 1 ? (
              <Button
                variant="icon"
                size="md"
                destructive
                className="flex-1 border-transparent"
                aria-label={`Quitar "${p.name}" del carrito`}
                onClick={(e) => {
                  e.stopPropagation()
                  // Sin modal de confirmación: se quita y el toast ofrece deshacer.
                  removeWithUndo({ product: p, qty: qtyInCart, preorderMode })
                }}
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            ) : (
              <Button
                variant="icon"
                size="md"
                className="flex-1 border-transparent"
                aria-label={`Quitar una unidad de "${p.name}"`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (updateQty(p.id, -1)) {
                    toast.success(`"${p.name}" — ${qtyInCart - 1} en el carrito`)
                  }
                }}
              >
                <Minus size={14} aria-hidden />
              </Button>
            )}
            <div
              className="flex-1 text-center font-display text-[16px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-11"
            >
              {qtyInCart}
              <span className="sr-only"> en el carrito</span>
            </div>
            <Button
              variant="icon"
              size="md"
              className="flex-1 border-transparent"
              disabled={remaining !== null && remaining === 0}
              aria-label={`Agregar una unidad de "${p.name}"`}
              onClick={(e) => {
                e.stopPropagation()
                // updateQty avisa por sí solo cuando se llegó al tope de stock.
                if (updateQty(p.id, 1)) {
                  toast.success(`"${p.name}" agregado — ${qtyInCart + 1} en el carrito`)
                }
              }}
            >
              <Plus size={14} aria-hidden />
            </Button>
          </div>
        ) : (
          <Button
            variant="accent"
            size="md"
            className="add-btn relative z-10 w-full min-h-11"
            disabled={ctaState !== 'idle'}
            onClick={(e) => {
              e.stopPropagation()
              if (addToCart(p, 1) > 0) {
                toast.success(
                  isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`,
                )
              }
            }}
          >
            {ctaState === 'out-of-stock' ? (
              'Sin stock'
            ) : ctaState === 'capped' ? (
              'Sin más stock'
            ) : (
              <>
                <ShoppingCart size={15} aria-hidden />
                {isPreorder ? 'Reservar ahora' : 'Agregar al carrito'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
