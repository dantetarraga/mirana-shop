'use client'

import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { ProductImageCarousel } from '@/features/products/components/ProductImageCarousel'
import { stockLimitMessage } from '@/features/products/lib/stock'
import { useProductModalStore } from '@/features/products/stores/product-modal.store'
import { getCategoryStripe, type CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { useJustAdded, useScrollLock } from '@/shared/hooks'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { ArrowRight, Check, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

/** El modal se cierra tras confirmar; lo justo para que la palomita se vea. */
const CLOSE_AFTER_ADD_MS = 900

export function ProductModal() {
  const { activeProduct: p, closeProductModal } = useProductModalStore()

  if (!p) return null

  // `key` remonta el contenido al cambiar de producto: la cantidad vuelve a 1
  // sin necesidad de resetearla desde un efecto.
  return <ProductModalContent key={p.id} p={p} onClose={closeProductModal} />
}

function ProductModalContent({ p: initial, onClose }: { p: CatalogProduct; onClose: () => void }) {
  const { addToCart, updateQty } = useCartStore()
  const { product: p, qtyInCart, isPreorder, isOutOfStock, remaining, unitPrice, hasDiscount, hydrated } =
    useCartLine(initial)
  const [chosenQty, setQty] = useState(1)
  const { justAdded, trigger } = useJustAdded(CLOSE_AFTER_ADD_MS)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useFocusTrap<HTMLDivElement>(true)

  // Si el modal se cierra a mano (o se cambia de producto) antes de que expire
  // el cierre diferido, el temporizador se cancela: si no, cerraría el modal
  // siguiente. El contenido se remonta por `key`, así que el efecto limpia el
  // temporizador de la instancia anterior.
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )
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
  const canAdd = remaining === null || remaining > 0
  // Recorta la cantidad elegida si el remanente baja mientras el modal está abierto.
  const qty = remaining === null ? chosenQty : Math.min(chosenQty, Math.max(1, remaining))
  const atLimit = remaining !== null && qty >= remaining

  const increase = () => {
    if (atLimit) {
      toast.warning(stockLimitMessage(p.name))
      return
    }
    setQty(qty + 1)
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
        className="bg-surf border border-(--bd) max-w-220 w-full max-h-[92vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 relative"
      >
        {/* Image */}
        <ProductImageCarousel
          images={p.images}
          name={p.name}
          sizes="(max-width: 640px) 100vw, 50vw"
          className={`${getCategoryStripe(p.category.slug)} min-h-70 sm:min-h-110 flex items-center justify-center relative`}
        >
          <Button
            variant="icon"
            size="md"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute top-4 right-4 z-10"
          >
            <X size={16} />
          </Button>
        </ProductImageCarousel>

        {/* Info */}
        <div className="p-5 sm:p-11 flex flex-col gap-4.5">
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

          {/* Lo que ya está en el carrito — el modal tampoco lo mostraba. */}
          {qtyInCart > 0 && (
            <div className="border border-(--bd) px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-[12px] tracking-[1px] uppercase text-muted" aria-live="polite">
                En tu carrito:{' '}
                <span className="text-accent-ink font-display font-extrabold text-[15px]">
                  {qtyInCart}
                </span>
              </div>
              <div className="flex items-center border border-(--bd)">
                <Button
                  variant="icon"
                  size="sm"
                  disabled={qtyInCart <= 1}
                  aria-label={`Quitar una unidad de "${p.name}"`}
                  onClick={() => updateQty(p.id, -1)}
                >
                  <Minus size={13} />
                </Button>
                <div className="w-9 text-center font-display text-[15px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-8">
                  {qtyInCart}
                </div>
                <Button
                  variant="icon"
                  size="sm"
                  disabled={remaining !== null && remaining === 0}
                  aria-label={`Agregar una unidad de "${p.name}"`}
                  onClick={() => updateQty(p.id, 1)}
                >
                  <Plus size={13} />
                </Button>
              </div>
            </div>
          )}

          {!isOutOfStock && canAdd && (
            <div>
              <div className="text-[10px] tracking-[2px] uppercase text-muted mb-2.5">
                {qtyInCart > 0 ? 'Agregar más' : 'Cantidad'}
              </div>
              <div className="flex items-center border border-(--bd) w-fit">
                <Button
                  variant="icon"
                  size="md"
                  disabled={qty <= 1}
                  aria-label="Quitar una unidad"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus size={14} />
                </Button>
                <div className="w-13 text-center font-display text-[20px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-10.5">
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
            </div>
          )}

          <Button
            variant={justAdded ? 'success' : 'accent'}
            size="lg"
            full
            disabled={isOutOfStock || !canAdd || !hydrated}
            onClick={() => {
              // El store vuelve a aplicar el tope y avisa si ya no cabe nada.
              if (addToCart(p, qty) > 0) {
                toast.success(
                  isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`,
                )
                trigger()
                // Se retrasa el cierre para que la confirmación llegue a verse;
                // si se cerrara al instante el botón desaparecería antes.
                closeTimer.current = setTimeout(onClose, CLOSE_AFTER_ADD_MS)
              }
            }}
          >
            {isOutOfStock ? (
              'Sin stock'
            ) : !canAdd ? (
              'Ya tenés todo el stock disponible'
            ) : justAdded ? (
              <>
                <Check size={16} strokeWidth={3} />
                {isPreorder ? 'Reservado' : 'Agregado al carrito'}
              </>
            ) : (
              `${isPreorder ? 'Reservar ahora' : 'Agregar al carrito'} · S/ ${(unitPrice * qty).toFixed(2)}`
            )}
          </Button>

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
  )
}
