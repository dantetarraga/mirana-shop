'use client'

import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { removeWithUndo } from '@/features/cart/lib/remove-with-undo'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { getProductBadge } from '@/features/products/lib/product-badge'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Ancho real de la card en cada breakpoint de los grids que la usan (home
 * 2→4 columnas, catálogo auto-fill de 220px, carrusel 2→5). Antes decía 33vw
 * entre 640 y 1024px, donde casi siempre hay 2 columnas: bajaba una imagen
 * más chica que la pintada y se veía borrosa.
 */
const DEFAULT_SIZES = '(max-width: 1023px) 50vw, (max-width: 1399px) 25vw, 350px'

/**
 * Dispositivos con hover real (mouse, trackpad). En táctil el CTA no puede
 * esperar a un hover que no existe: se usa el botón redondo de la esquina.
 */
const HOVER_ONLY = 'hidden [@media(hover:hover)]:flex'
const TOUCH_ONLY = '[@media(hover:hover)]:hidden'

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
  const setCartOpen = useCartStore((s) => s.setCartOpen)
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
  const stripe = getCategoryStripe(p.category.slug)
  const catLabel = p.category.name

  // Una sola badge por card, misma regla que la ficha.
  const badge = getProductBadge({ ...p, isOutOfStock })

  const addLabel = isPreorder ? 'Reservar' : 'Agregar al carrito'
  // El store abre el drawer al agregar: esa es la confirmación (ya no hay
  // toast de éxito; los avisos de tope de stock los sigue dando el store).
  const add = () => {
    if (ctaState === 'idle') addToCart(p, 1)
  }

  return (
    // `group` para revelar el CTA de escritorio con hover o con foco dentro.
    <div className="pcard group">
      {/* Navegación directa al PDP. El `::after` absoluto estira el área
          clicable del enlace a toda la card (`.pcard` es `relative`), así el
          precio también lleva a la ficha sin anidar los botones del carrito
          dentro del <a>, que sería HTML inválido. */}
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

      {/* Precio: queda bajo el `::after`, así que un clic también lleva a la ficha. */}
      <div className="px-4 pb-4">
        <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
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
      </div>

      {/* Controles del carrito sobre la imagen. Son HERMANOS del enlace (no van
          dentro del <a>) y ocupan la misma caja que la foto: `inset-x-0 top-0`
          + el mismo aspect 4:5. El contenedor no recibe clics
          (`pointer-events-none`) para que la foto siga llevando a la ficha; solo
          los botones los reactivan. Agotado o sin estado del carrito todavía
          (hidratando): no hay botón. */}
      {(ctaState === 'idle' || ctaState === 'in-cart') && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5] z-10 overflow-hidden">
          {/* Escritorio: barra que sube desde el borde inferior de la foto con
              hover o con foco dentro de la card (teclado). El recorte del
              contenedor la deja fuera de la caja (ni visible ni clicable) hasta
              entonces. */}
          <div
            className={cn(
              HOVER_ONLY,
              'absolute inset-x-0 bottom-0 p-3 translate-y-full opacity-0 transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none',
              'group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100',
            )}
          >
            {ctaState === 'in-cart' ? (
              <div className="pointer-events-auto flex items-center w-full bg-surf border border-(--bd) shadow-pop">
                {qtyInCart === 1 ? (
                  <Button
                    variant="icon"
                    size="md"
                    destructive
                    className="flex-1 border-transparent"
                    aria-label={`Quitar "${p.name}" del carrito`}
                    // Sin modal de confirmación: se quita y el toast ofrece deshacer.
                    onClick={() => removeWithUndo({ product: p, qty: qtyInCart, preorderMode })}
                  >
                    <Trash2 size={14} aria-hidden />
                  </Button>
                ) : (
                  <Button
                    variant="icon"
                    size="md"
                    className="flex-1 border-transparent"
                    aria-label={`Quitar una unidad de "${p.name}"`}
                    onClick={() => updateQty(p.id, -1)}
                  >
                    <Minus size={14} aria-hidden />
                  </Button>
                )}
                <div className="flex-1 h-11 flex items-center justify-center font-display text-[16px] font-extrabold border-x border-(--bd)">
                  {qtyInCart}
                  <span className="sr-only"> en el carrito</span>
                </div>
                <Button
                  variant="icon"
                  size="md"
                  className="flex-1 border-transparent"
                  disabled={remaining !== null && remaining === 0}
                  aria-label={`Agregar una unidad de "${p.name}"`}
                  // Cambiar cantidad no abre el drawer; el store avisa el tope.
                  onClick={() => updateQty(p.id, 1)}
                >
                  <Plus size={14} aria-hidden />
                </Button>
              </div>
            ) : (
              <Button
                variant="accent"
                size="md"
                className="add-btn pointer-events-auto w-full min-h-11 shadow-pop"
                onClick={add}
              >
                <ShoppingCart size={15} aria-hidden />
                {addLabel}
              </Button>
            )}
          </div>

          {/* Táctil: botón redondo en la esquina inferior derecha de la foto,
              siempre visible. Con el producto ya agregado muestra cuántas hay y
              abre el carrito (ahí se editan las cantidades). */}
          {ctaState === 'in-cart' ? (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Ver carrito: ${qtyInCart} de ${p.name}`}
              className={cn(
                TOUCH_ONLY,
                'pointer-events-auto absolute bottom-2.5 right-2.5 size-11 rounded-full flex items-center justify-center bg-success text-on-success shadow-pop font-display text-[16px] font-extrabold',
              )}
            >
              {qtyInCart}
            </button>
          ) : (
            <button
              type="button"
              onClick={add}
              aria-label={isPreorder ? `Reservar ${p.name}` : `Agregar ${p.name} al carrito`}
              className={cn(
                TOUCH_ONLY,
                'pointer-events-auto absolute bottom-2.5 right-2.5 size-11 rounded-full flex items-center justify-center bg-gold-500 text-on-accent shadow-pop active:scale-95 transition-transform motion-reduce:transition-none',
              )}
            >
              <ShoppingCart size={18} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
