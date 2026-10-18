'use client'

import { CartLineItem } from '@/features/cart/components/CartLineItem'
import { CartPreorderNotice } from '@/features/cart/components/CartPreorderNotice'
import {
  CartRecommendationsColumn,
  CartRecommendationsStrip,
  useCartRecommendations,
} from '@/features/cart/components/CartRecommendations'
import { cartKindOf } from '@/features/cart/lib/cart-kind'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { eligibleDeliveryMethods } from '@/features/checkout/lib/delivery-eligibility'
import { splitPreorderTotals } from '@/features/checkout/lib/preorder'
import { computeTotals, type PricingRules } from '@/features/checkout/lib/pricing'
import { Button } from '@/shared/components/ui/Button'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowRight, ShoppingCart, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId } from 'react'

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
  // Selectores por campo: desestructurar `useCartStore()` suscribe a TODO el
  // store y re-renderiza el drawer con cualquier cambio (p. ej. pendingWrites).
  const cart = useCartStore((s) => s.cart)
  const cartCount = useCartStore((s) => s.cartCount)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const refreshCart = useCartStore((s) => s.refreshCart)
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
  const panelRef = useFocusTrap<HTMLDivElement>(true)
  const titleId = useId()
  // "También te puede gustar" del último producto agregado (solo tras agregar:
  // abrir el carrito desde el navbar no trae ancla).
  const recommendations = useCartRecommendations()
  const closeDrawer = () => setCartOpen(false)

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
      if (e.key === 'Escape') setCartOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setCartOpen])

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
      {/* Overlay como <button>: clicable y con semántica, sin entrar al
          orden de Tab (el cierre por teclado es Escape o la X). */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar carrito"
        onClick={() => setCartOpen(false)}
        className="fixed inset-0 z-550 w-full h-full bg-scrim backdrop-blur-[6px] cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // `flex-row-reverse`: el carrito va primero en el DOM (foco inicial y
        // orden de lectura) pero se pinta a la derecha; las recomendaciones de
        // escritorio quedan como columna a su izquierda y ensanchan el drawer.
        className="fixed top-0 right-0 bottom-0 z-551 w-full sm:w-auto bg-surf border-l border-(--bd) flex flex-row-reverse animate-slide-right"
      >
        <div className="w-full sm:w-105 min-w-0 flex flex-col">
          {/* Header */}
          <div className="px-5 sm:px-7 py-6 border-b border-(--bd) flex items-center justify-between">
            <h2
              id={titleId}
              className="font-display text-[26px] font-black uppercase tracking-[1px]"
            >
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
                <X size={18} aria-hidden />
              </Button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 flex flex-col gap-3.5">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-5 text-muted">
                {/* Icono de lucide, no emoji: el emoji lo dibuja el sistema
                  operativo y cambia de estilo y color entre plataformas. */}
                <ShoppingCart
                  size={52}
                  strokeWidth={1}
                  className="mx-auto mb-4 opacity-25"
                  aria-hidden
                />
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
              <>
                <CartPreorderNotice cart={cart} />
                {cart.map((item) => (
                  <CartLineItem
                    key={item.product.id}
                    item={item}
                    depositPercent={pricingRules.preorderDepositPercent}
                    variant="compact"
                    onNavigate={closeDrawer}
                  />
                ))}
                <CartRecommendationsStrip state={recommendations} onNavigate={closeDrawer} />
              </>
            )}
          </div>

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
                    <span className="text-success font-semibold">−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-muted">Envío</span>
                  {shippingFree || shippingCost === 0 ? (
                    <span className="text-success font-semibold">Gratis</span>
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
                <ArrowRight size={14} className="ml-1" strokeWidth={3} aria-hidden />
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

        <CartRecommendationsColumn state={recommendations} onNavigate={closeDrawer} />
      </div>
    </>
  )
}
