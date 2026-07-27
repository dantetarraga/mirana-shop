'use client'

import { cartKindOf } from '@/features/cart/lib/cart-kind'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { eligibleDeliveryMethods } from '@/features/checkout/lib/delivery-eligibility'
import { depositUnitPrice, splitPreorderTotals } from '@/features/checkout/lib/preorder'
import { computeTotals, effectivePrice, type PricingRules } from '@/features/checkout/lib/pricing'
import { maxPurchasable } from '@/features/products/lib/stock'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useScrollLock } from '@/shared/hooks'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowRight, Minus, Plus, ShoppingCart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

interface CartDrawerProps {
  pricingRules: PricingRules
}

export function CartDrawer({ pricingRules }: CartDrawerProps) {
  const cartOpen = useCartStore((s) => s.cartOpen)

  if (!cartOpen) return null

  // El contenido se desmonta al cerrar, así el borrado pendiente se descarta
  // solo — sin resetear estado desde un efecto.
  return <CartDrawerContent pricingRules={pricingRules} />
}

/** Elementos del layout que quedan fuera del diálogo mientras está abierto. */
const BACKGROUND_SELECTOR = 'nav, #main, footer'

function CartDrawerContent({ pricingRules }: CartDrawerProps) {
  const { cart, cartCount, setCartOpen, updateQty, removeItem, refreshCart } = useCartStore()
  const busy = useCartStore((s) => s.pendingWrites > 0)
  // `payableNow` es lo que se cobra hoy: en las líneas de preventa parcial solo
  // el adelanto. Sin líneas parciales coincide con el subtotal y todo el cálculo
  // se comporta igual que antes.
  const { subtotal, payableNow, dueTotal } = splitPreorderTotals(
    cart,
    pricingRules.preorderDepositPercent,
  )
  // El envío que se adelanta es el de la entrega que el checkout va a
  // preseleccionar para ESTE carrito: con preventa el envío a domicilio no es
  // elegible (features/checkout/lib/delivery-eligibility.ts).
  const deliveryMethods = eligibleDeliveryMethods(
    pricingRules.deliveryMethods,
    cartKindOf(cart.map((i) => i.product)),
  )
  const { shippingFree, shippingCost, discount, discountName, total } = computeTotals(
    payableNow,
    pricingRules,
    { shippingCost: deliveryMethods[0]?.cost },
  )
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)
  const panelRef = useFocusTrap<HTMLDivElement>(true)
  const titleId = useId()

  useScrollLock(true)

  // Al abrir se relee el carrito del servidor: es el momento en que el usuario
  // va a revisar precios y cantidades, y hasta ahora el drawer nunca revalidaba
  // (la primera señal de que algo no cuadraba era el rechazo de placeOrder).
  useEffect(() => {
    refreshCart()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshCart()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshCart])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // El ConfirmModal de borrado también escucha Escape en `window`: sin este
      // guardia una sola pulsación cerraba la confirmación Y el drawer entero.
      if (e.key === 'Escape' && pendingRemove === null) setCartOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setCartOpen, pendingRemove])

  // El fondo queda inerte para el lector de pantalla y para el tabulador; antes
  // el foco estaba atrapado pero el cursor virtual seguía recorriendo la página.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(BACKGROUND_SELECTOR))
    for (const node of nodes) node.inert = true
    return () => {
      for (const node of nodes) node.inert = false
    }
  }, [])

  return (
    <>
      <div
        onClick={() => setCartOpen(false)}
        className="fixed inset-0 z-400 bg-scrim backdrop-blur-[6px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed top-0 right-0 bottom-0 z-401 w-full sm:w-105 bg-surf border-l border-(--bd) flex flex-col animate-slide-right"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-6 border-b border-(--bd) flex items-center justify-between">
          <h2 id={titleId} className="font-display text-[26px] font-black uppercase tracking-[1px]">
            Carrito{' '}
            <span className="text-accent-ink" aria-live="polite">
              ({cartCount})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {/* Los controles no se deshabilitan mientras se guarda: la UI es
                optimista y bloquearlos rompería el +/− rápido. El estado se
                comunica en su lugar. */}
            <span
              className={`text-[10px] tracking-[1px] uppercase text-muted transition-opacity duration-200 ${busy ? 'opacity-100' : 'opacity-0'}`}
              aria-live="polite"
            >
              {busy ? 'Guardando…' : ''}
            </span>
            <Button
              variant="icon"
              size="md"
              aria-label="Cerrar carrito"
              onClick={() => setCartOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 flex flex-col gap-3.5">
          {cart.length === 0 ? (
            <div className="text-center py-16 px-5 text-muted">
              {/* Icono de lucide, no emoji: el emoji lo dibuja el sistema
                  operativo y cambia de estilo y color entre plataformas. */}
              <ShoppingCart size={52} strokeWidth={1} className="mx-auto mb-4 opacity-25" />
              <div className="font-display text-[22px] font-black uppercase mb-2">
                Carrito vacío
              </div>
              <div className="text-[13px] mb-6">Agrega productos para continuar</div>
              <Link
                href="/catalogo"
                onClick={() => setCartOpen(false)}
                className="ui-btn ui-btn--accent ui-btn--md"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            cart.map((item) => {
              const max = maxPurchasable(item.product)
              const atLimit = max !== null && item.qty >= max
              const unavailable = max === 0
              const isPartial = item.preorderMode === 'PARTIAL'
              const deposit = isPartial
                ? depositUnitPrice(item.product, pricingRules.preorderDepositPercent)
                : null

              return (
                <div
                  key={item.product.id}
                  className="flex gap-3.5 items-center pb-3.5 border-b border-(--bd)"
                >
                  <Link
                    href={`/catalogo/${item.product.slug}`}
                    onClick={() => setCartOpen(false)}
                    className="relative w-17.5 h-17.5 shrink-0 overflow-hidden block"
                  >
                    {item.product.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="70px"
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className={`${getCategoryStripe(item.product.category.slug)} w-full h-full`}
                      />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/catalogo/${item.product.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="font-display text-[17px] font-extrabold uppercase whitespace-nowrap overflow-hidden text-ellipsis block hover:text-accent-ink transition-colors duration-150"
                    >
                      {item.product.name}
                    </Link>
                    <div className="text-accent-ink font-display text-[20px] font-extrabold mt-px">
                      {formatCurrency(deposit ?? effectivePrice(item.product))}
                    </div>
                    {deposit !== null && (
                      <div className="text-[11px] text-muted">
                        <span className="text-info font-semibold">Preventa parcial</span> · de{' '}
                        {formatCurrency(effectivePrice(item.product))}
                      </div>
                    )}
                    {/* Un producto puede agotarse mientras está en el carrito. */}
                    {unavailable && (
                      <div className="text-[11px] text-danger font-semibold mt-0.5">
                        Sin stock — quitalo para continuar
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="icon"
                        size="sm"
                        disabled={item.qty <= 1}
                        aria-label={`Quitar una unidad de "${item.product.name}"`}
                        onClick={() => updateQty(item.product.id, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="font-display font-extrabold min-w-6 text-center">
                        {item.qty}
                      </span>
                      <Button
                        variant="icon"
                        size="sm"
                        disabled={atLimit}
                        aria-label={`Agregar una unidad de "${item.product.name}"`}
                        onClick={() => updateQty(item.product.id, 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="icon"
                    size="sm"
                    destructive
                    aria-label={`Eliminar "${item.product.name}" del carrito`}
                    onClick={() =>
                      setPendingRemove({ id: item.product.id, name: item.product.name })
                    }
                    className="self-start"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )
            })
          )}
        </div>

        <ConfirmModal
          open={pendingRemove !== null}
          onClose={() => setPendingRemove(null)}
          onConfirm={() => {
            if (!pendingRemove) return
            removeItem(pendingRemove.id)
            toast.success(`"${pendingRemove.name}" eliminado del carrito`)
            setPendingRemove(null)
          }}
          title="¿Eliminar producto?"
          description={
            pendingRemove ? `"${pendingRemove.name}" será eliminado de tu carrito.` : undefined
          }
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
        />

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-5 sm:px-7 py-6 border-t border-(--bd)">
            {/* computeTotals mete el envío dentro de `total`. Antes solo se veían
                Descuento y Total, así que el número no cuadraba con las líneas a
                la vista ni con el desglose de /carrito. */}
            <div className="flex flex-col gap-2 mb-4 text-[13px]">
              <div className="flex justify-between items-baseline">
                <span className="text-muted">
                  {dueTotal > 0 ? 'Subtotal a pagar hoy' : 'Subtotal'}
                </span>
                <span className="font-semibold">{formatCurrency(payableNow)}</span>
              </div>
              {dueTotal > 0 && (
                <div className="flex justify-between items-baseline text-[12px] text-muted">
                  <span>Valor total del pedido</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-muted">
                    Descuento{discountName ? ` — ${discountName}` : ''}
                  </span>
                  <span className="text-green-400 font-semibold">−{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-muted">Envío</span>
                {shippingFree || shippingCost === 0 ? (
                  <span className="text-green-400 font-semibold">Gratis</span>
                ) : (
                  <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-baseline mb-1 border-t border-(--bd) pt-3.5">
              <span className="text-[12px] uppercase tracking-[1px] text-muted">
                {dueTotal > 0 ? 'Pagas hoy' : 'Total'}
              </span>
              <span
                className="font-display text-[38px] font-black text-accent-ink"
                aria-live="polite"
              >
                {formatCurrency(total)}
              </span>
            </div>
            {dueTotal > 0 && (
              <div className="flex justify-between items-baseline mb-4 text-[12px]">
                <span className="text-muted">Saldo pendiente</span>
                <span className="text-info font-semibold">{formatCurrency(dueTotal)}</span>
              </div>
            )}
            <div className="mb-5" />
            {/* Link con estilo de botón — antes era <Button><Link/></Button>,
                que genera un <a> dentro de un <button> (HTML inválido, doble tab). */}
            <Link
              href="/carrito"
              onClick={() => setCartOpen(false)}
              className="ui-btn ui-btn--accent ui-btn--lg ui-btn--full"
            >
              Ver carrito y pagar
              <ArrowRight size={14} className="ml-1" strokeWidth={3} />
            </Link>
            {pricingRules.freeShippingThreshold != null && (
              <div className="text-center mt-3 text-[12px] text-muted">
                {shippingFree
                  ? '¡Envío gratis aplicado!'
                  : `Envío gratis en pedidos +${formatCurrency(pricingRules.freeShippingThreshold)}`}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
