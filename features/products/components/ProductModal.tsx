'use client'

import { CartCtaSkeleton } from '@/features/cart/components/CartCtaSkeleton'
import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { useCartStore } from '@/features/cart/stores/cart.store'
import type { PreorderMode } from '@/features/checkout/lib/preorder'
import { ProductImageCarousel } from '@/features/products/components/ProductImageCarousel'
import { maxPurchasable, stockLimitMessage } from '@/features/products/lib/stock'
import { useProductModalStore } from '@/features/products/stores/product-modal.store'
import { getCategoryStripe, type CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { useScrollLock } from '@/shared/hooks'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { ArrowRight, Check, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

export function ProductModal({ defaultDepositPercent }: { defaultDepositPercent: number }) {
  const { activeProduct: p, closeProductModal } = useProductModalStore()

  if (!p) return null

  // `key` remonta el contenido al cambiar de producto: la cantidad vuelve a 1
  // sin necesidad de resetearla desde un efecto.
  return (
    <ProductModalContent
      key={p.id}
      p={p}
      onClose={closeProductModal}
      defaultDepositPercent={defaultDepositPercent}
    />
  )
}

function ProductModalContent({
  p: initial,
  onClose,
  defaultDepositPercent,
}: {
  p: CatalogProduct
  onClose: () => void
  defaultDepositPercent: number
}) {
  const { addToCart, updateQty, setLineMode } = useCartStore()
  const {
    product: p,
    qtyInCart,
    isPreorder,
    isOutOfStock,
    unitPrice,
    hasDiscount,
    preorder,
    preorderMode,
    ctaState,
  } = useCartLine(initial, defaultDepositPercent)
  const [chosenQty, setQty] = useState(1)
  const [chosenMode, setChosenMode] = useState<PreorderMode>('FULL')
  const loading = ctaState === 'loading'
  const inCart = qtyInCart > 0
  const mode: PreorderMode = inCart ? preorderMode : chosenMode
  const payNowUnit = preorder && mode === 'PARTIAL' ? preorder.depositUnit : unitPrice
  const panelRef = useFocusTrap<HTMLDivElement>(true)
  const titleId = useId()

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Bloquea el scroll del fondo mientras el modal está abierto.
  useScrollLock(true)

  // Disponibilidad, tope y precio salen de useCartLine para que la card, este
  // modal y el PDP no puedan divergir (antes tenían tres cálculos distintos).
  //
  // El selector de cantidad tiene dos vidas: antes de agregar decide CUÁNTAS se
  // van a agregar (estado local), y una vez agregado ES la cantidad del carrito
  // y la edita en vivo. Por eso ya no hace falta un bloque aparte de "En tu
  // carrito": el mismo control muestra y sincroniza.
  const max = maxPurchasable(p) // null = sin tope (preventa)
  const qty = inCart
    ? qtyInCart
    : max === null
      ? chosenQty
      : Math.min(chosenQty, Math.max(1, max))
  const atLimit = max !== null && qty >= max

  // Con el producto ya en el carrito el selector escribe en el servidor, así que
  // se confirma con un toast (ver AddToCartPanel).
  const increase = () => {
    if (atLimit) {
      toast.warning(stockLimitMessage(p.name))
      return
    }
    if (!inCart) {
      setQty(qty + 1)
      return
    }
    if (updateQty(p.id, 1)) toast.success(`"${p.name}" agregado — ${qty + 1} en el carrito`)
  }

  const decrease = () => {
    if (qty <= 1) return
    if (!inCart) {
      setQty(qty - 1)
      return
    }
    if (updateQty(p.id, -1)) toast.success(`"${p.name}" — ${qty - 1} en el carrito`)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-300 bg-scrim backdrop-blur-[10px] flex items-center justify-center p-3 sm:p-6"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="bg-surf border border-(--bd) max-w-220 w-full max-h-[92vh] flex flex-col relative overflow-hidden"
      >
        {/* La X vive en el panel, no dentro del carrusel: ahí quedaba pegada al
            borde derecho de la IMAGEN, o sea a mitad del modal en desktop, y
            además se iba con el scroll. Fuera del contenedor que scrollea queda
            siempre en la esquina superior derecha del diálogo. */}
        <Button
          variant="icon"
          size="md"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 bg-surf/80 backdrop-blur-sm"
        >
          <X size={16} />
        </Button>

        <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 sm:items-stretch">
          {/* Image */}
          {/* `sm:flex-1` y no `sm:min-h-full`: el carrusel es un flex-col con la
              imagen grande arriba y las miniaturas abajo, así que pedirle el
              100% del alto a la imagen dejaba a las miniaturas sin espacio y
              desaparecían. Con flex-1 la imagen absorbe el sobrante y las
              miniaturas conservan su tamaño natural. */}
          <ProductImageCarousel
            images={p.images}
            name={p.name}
            sizes="(max-width: 640px) 100vw, 50vw"
            className={`${getCategoryStripe(p.category.slug)} min-h-70 sm:min-h-100 sm:flex-1 flex items-center justify-center relative`}
            thumbClassName="w-14 h-14 sm:w-15 sm:h-15"
            // La imagen grande va de borde a borde, pero las miniaturas pegadas
            // al filo del panel se ven apretadas.
            thumbsWrapperClassName="px-3 pb-3 sm:px-4 sm:pb-4"
          />

          {/* Info — `justify-center` reparte el sobrante arriba y abajo en vez
              de dejar un hueco grande solo al pie cuando la ficha es corta. */}
          <div className="p-5 sm:px-9 sm:py-8 flex flex-col justify-center gap-4">
          <div>
            <div className="text-[10px] tracking-[3px] uppercase text-muted">
              {p.category.name} · {p.brand.name}
            </div>
            <h2
              id={titleId}
              className="font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(28px,4vw,48px)]"
            >
              {p.name}
            </h2>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="font-display text-[38px] sm:text-[52px] font-black text-accent-ink leading-none">
              S/ {unitPrice.toFixed(2)}
            </div>
            {hasDiscount && (
              <div className="font-display text-[20px] sm:text-[26px] font-normal text-muted line-through leading-none">
                S/ {p.price.toFixed(2)}
              </div>
            )}
          </div>

          {/* Preventa total vs parcial — mismo contrato que el PDP. */}
          {preorder && !isOutOfStock && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  { value: 'FULL' as const, title: 'Preventa total', amount: unitPrice, hint: 'Pagas todo ahora' },
                  {
                    value: 'PARTIAL' as const,
                    title: 'Preventa parcial',
                    amount: preorder.depositUnit,
                    hint: `Adelanto ${preorder.depositPercent}%`,
                  },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={mode === opt.value}
                  onClick={() =>
                    qtyInCart > 0 ? setLineMode(p.id, opt.value) : setChosenMode(opt.value)
                  }
                  className={`text-left border px-3 py-2.5 transition-colors duration-200 ${
                    mode === opt.value
                      ? 'border-(--gold) bg-(--gold)/10'
                      : 'border-(--bd) hover:border-(--bdh)'
                  }`}
                >
                  <span className="block text-[10px] tracking-[2px] uppercase text-muted">
                    {opt.title}
                  </span>
                  <span className="block font-display text-[20px] font-black text-accent-ink leading-tight">
                    S/ {opt.amount.toFixed(2)}
                  </span>
                  <span className="block text-[11px] text-muted">{opt.hint}</span>
                </button>
              ))}
            </div>
          )}

          {!isOutOfStock && ctaState !== 'capped' && !loading && (
            <div>
              <div className="text-[10px] tracking-[2px] uppercase text-muted mb-2.5">
                {inCart ? 'En tu carrito' : 'Cantidad'}
              </div>
              {
                <>
                  <div className="flex items-center border border-(--bd) w-fit">
                    <Button
                      variant="icon"
                      size="md"
                      disabled={qty <= 1}
                      aria-label="Quitar una unidad"
                      onClick={decrease}
                    >
                      <Minus size={14} />
                    </Button>
                    <div
                      className="w-13 text-center font-display text-[20px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-10.5"
                      aria-live="polite"
                    >
                      {qty}
                    </div>
                    <Button
                      variant="icon"
                      size="md"
                      disabled={atLimit}
                      aria-label="Agregar una unidad"
                      onClick={increase}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  {inCart && (
                    <p className="text-[11px] text-muted mt-1.5">
                      Se actualiza en tu carrito al instante.
                    </p>
                  )}
                </>
              }
            </div>
          )}

          {/* Una vez agregado el botón queda en verde de forma permanente (no
              un destello): mientras el producto siga en el carrito, ese es su
              estado. Ya no cierra el modal — se puede seguir ajustando la
              cantidad o cambiar la forma de pago sin perder la ficha. */}
          {loading ? (
            <CartCtaSkeleton withQuantity={!isOutOfStock} />
          ) : (
            <Button
              variant={ctaState === 'in-cart' ? 'success' : 'accent'}
              size="lg"
              full
              // Ver AddToCartPanel: "Agregado" es un estado, no un botón
              // inhabilitado — con `disabled` el verde se veía al 40%.
              disabled={ctaState === 'out-of-stock' || ctaState === 'capped'}
              aria-disabled={ctaState === 'in-cart' || undefined}
              className={ctaState === 'in-cart' ? 'cursor-default' : undefined}
              onClick={() => {
                if (ctaState !== 'idle') return
                // El store vuelve a aplicar el tope y avisa si ya no cabe nada.
                if (addToCart(p, qty, mode) > 0) {
                  toast.success(
                    isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`,
                  )
                }
              }}
            >
              {ctaState === 'out-of-stock' ? (
                'Sin stock'
              ) : ctaState === 'capped' ? (
                'Ya tienes todo el stock disponible'
              ) : ctaState === 'in-cart' ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  {isPreorder ? 'Reservado' : 'Agregado al carrito'}
                </>
              ) : (
                `${isPreorder ? 'Reservar ahora' : 'Agregar al carrito'} · S/ ${(payNowUnit * qty).toFixed(2)}`
              )}
            </Button>
          )}

          <Link
            href={`/catalogo/${p.slug}`}
            onClick={onClose}
            className="inline-flex justify-center items-center w-full text-center border border-(--bd) px-6 py-3 text-[12px] tracking-[2px] uppercase font-display font-extrabold hover:border-(--gold) hover:text-accent-ink transition-colors duration-300"
          >
            Ver detalles del producto
            <ArrowRight className="ml-1" size={14} strokeWidth={3} />
          </Link>

            <Button variant="ghost" size="lg" full onClick={onClose}>
              Seguir explorando
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
