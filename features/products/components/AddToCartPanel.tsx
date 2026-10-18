'use client'

import { CartCtaSkeleton } from '@/features/cart/components/CartCtaSkeleton'
import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { useCartStore } from '@/features/cart/stores/cart.store'
import type { PreorderMode } from '@/features/checkout/lib/preorder'
import {
  LOW_STOCK_HINT_THRESHOLD,
  maxPurchasable,
  stockLimitMessage,
} from '@/features/products/lib/stock'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { Check, Minus, PackageCheck, Plus, ShoppingBag, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  product: CatalogProduct
  /** % de adelanto por defecto de la tienda (se usa si el producto no define el suyo) */
  defaultDepositPercent: number
}

export function AddToCartPanel({ product, defaultDepositPercent }: Props) {
  const addToCart = useCartStore((s) => s.addToCart)
  const updateQty = useCartStore((s) => s.updateQty)
  const setLineMode = useCartStore((s) => s.setLineMode)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const {
    product: p,
    qtyInCart,
    isPreorder,
    isOutOfStock,
    unitPrice,
    preorder,
    preorderMode,
    ctaState,
  } = useCartLine(product, defaultDepositPercent)
  const [chosenQty, setQty] = useState(1)
  const [chosenMode, setChosenMode] = useState<PreorderMode>('FULL')
  // La barra fija de móvil solo aparece cuando el CTA principal salió de
  // pantalla: duplicarlo mientras está a la vista sería ruido.
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = useState(true)

  useEffect(() => {
    const el = ctaRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), {
      // El navbar fijo tapa la parte de arriba: lo que queda debajo no cuenta.
      rootMargin: '-80px 0px 0px 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const loading = ctaState === 'loading'
  const inCart = qtyInCart > 0

  // Con el producto ya en el carrito manda el modo guardado (así el selector
  // refleja lo que realmente se va a cobrar); si no, el que eligió el usuario.
  const mode: PreorderMode = inCart ? preorderMode : chosenMode
  const payNowUnit = preorder && mode === 'PARTIAL' ? preorder.depositUnit : unitPrice

  // El selector tiene dos vidas: antes de agregar decide CUÁNTAS se van a
  // agregar (estado local), y una vez agregado ES la cantidad del carrito y la
  // edita en vivo. Por eso el tope es `maxPurchasable` (el total disponible) y
  // no `remaining` (lo que falta por agregar): el número mostrado ya es el total.
  const max = maxPurchasable(p) // null = sin tope (preventa)
  const qty = inCart
    ? qtyInCart
    : max === null
      ? chosenQty
      : Math.min(chosenQty, Math.max(1, max))

  const atLimit = max !== null && qty >= max

  // Aviso de disponibilidad. En vez de aparecer y desaparecer (que hacía
  // parpadear el bloque al usar el selector), cambia de mensaje:
  //   - llegaste al tope  → ya te llevaste todo lo que había
  //   - queda poco stock  → urgencia
  // El botón no puede decirlo: con unidades en el carrito muestra "Agregado".
  // Ninguno de los dos revela la cifra exacta de stock.
  const stockNotice =
    isOutOfStock || isPreorder || loading
      ? null
      : max !== null && qtyInCart > 0 && qtyInCart >= max
        ? {
            text: 'Ya tienes todas las unidades disponibles en tu carrito',
            tone: 'info' as const,
            Icon: PackageCheck,
          }
        : p.stock > 0 && p.stock <= LOW_STOCK_HINT_THRESHOLD
          ? { text: '¡Últimas unidades disponibles!', tone: 'warn' as const, Icon: TriangleAlert }
          : null

  // Al tocar el selector con el producto ya en el carrito se está escribiendo en
  // el servidor, así que se confirma con un toast — mismo texto que la card.
  // Antes de agregar no hay nada que confirmar: solo se elige un número.
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
    <div className="flex flex-col gap-4">
      {/* Aviso de disponibilidad — ver `stockNotice`. */}
      {stockNotice && (
        <div
          aria-live="polite"
          className={`text-[12px] font-semibold tracking-[0.5px] flex items-center gap-1.5 ${
            stockNotice.tone === 'warn' ? 'text-warning' : 'text-info'
          }`}
        >
          <stockNotice.Icon size={14} className="shrink-0" aria-hidden />
          {stockNotice.text}
        </div>
      )}

      {/* Cómo pagar la preventa. Solo aparece si el producto lo admite; el
          servidor vuelve a validarlo, así que forzar 'PARTIAL' en el payload de
          un producto que no lo permite igual se cobra completo. */}
      {preorder && !isOutOfStock && (
        <div>
          <div className="text-[11px] tracking-[2px] uppercase text-muted mb-2.5">
            Forma de pago
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              [
                {
                  value: 'FULL' as const,
                  title: 'Preventa total',
                  amount: unitPrice,
                  hint: 'Pagas todo ahora',
                },
                {
                  value: 'PARTIAL' as const,
                  title: 'Preventa parcial',
                  amount: preorder.depositUnit,
                  hint: `Adelanto ${preorder.depositPercent}% · saldo S/ ${preorder.balanceUnit.toFixed(2)}`,
                },
              ]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={mode === opt.value}
                onClick={() => (inCart ? setLineMode(p.id, opt.value) : setChosenMode(opt.value))}
                className={`text-left border px-3.5 py-3 transition-colors duration-200 ${
                  mode === opt.value
                    ? 'border-(--gold) bg-(--gold)/10'
                    : 'border-(--bd) hover:border-(--bdh)'
                }`}
              >
                <span className="block text-[11px] tracking-[2px] uppercase text-muted">
                  {opt.title}
                </span>
                <span className="block font-display text-[22px] font-black text-accent-ink leading-tight">
                  S/ {opt.amount.toFixed(2)}
                </span>
                <span className="block text-[11px] text-muted mt-0.5">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector de cantidad. Mientras no se sabe si el producto está en el
          carrito se deja el hueco: pintarlo con "Cantidad 1" y corregirlo a
          "En tu carrito 3" al hidratar era el mismo parpadeo que el botón. */}
      {!isOutOfStock && ctaState !== 'capped' && !loading && (
        <div>
          <div className="text-[11px] tracking-[2px] uppercase text-muted mb-2.5">
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
                  <Minus size={14} aria-hidden />
                </Button>
                <div
                  className="w-13 text-center font-display text-[20px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-11"
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
                  <Plus size={14} aria-hidden />
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

      {/* El verde deriva del carrito, no de un temporizador: mientras el
          producto siga agregado, ese es su estado. */}
      <div ref={ctaRef}>
      {loading ? (
        <CartCtaSkeleton withQuantity={!isOutOfStock} />
      ) : (
        <Button
          variant={ctaState === 'in-cart' ? 'success' : 'accent'}
          size="lg"
          full
          // "Agregado" no lleva `disabled`: esa regla lo pinta al 40% de opacidad
          // (globals.css `.ui-btn:disabled`) y el verde quedaba apagado. Es un
          // estado, no un botón inhabilitado. Se marca con `aria-disabled` y el
          // handler corta igual, así que no dispara nada.
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
            `${isPreorder ? 'Reservar' : 'Agregar al carrito'} · S/ ${(payNowUnit * qty).toFixed(2)}`
          )}
        </Button>
      )}
      </div>

      {preorder && mode === 'PARTIAL' && !isOutOfStock && !loading && (
        <p className="text-[12px] text-muted -mt-2">
          Pagas S/ {(preorder.depositUnit * qty).toFixed(2)} ahora y{' '}
          <span className="text-info font-semibold">
            S/ {(preorder.balanceUnit * qty).toFixed(2)}
          </span>{' '}
          cuando el producto esté listo para entregarse.
        </p>
      )}

      {/* Barra de compra fija (móvil/tablet). `data-sticky-cta` sube el FAB de
          WhatsApp y reserva espacio al pie (globals.css). Sale de la vista con
          `translate` en vez de desmontarse para no saltar al aparecer. */}
      {!loading && ctaState !== 'out-of-stock' && (
        <div
          data-sticky-cta
          aria-hidden={ctaVisible}
          inert={ctaVisible}
          className={`sticky-cta lg:hidden fixed inset-x-0 bottom-0 z-150 bg-surf/95 backdrop-blur-md border-t border-(--bd) px-4 pt-3 flex items-center gap-3 transition-transform duration-200 ${
            ctaVisible ? 'translate-y-full' : 'translate-y-0'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted truncate">{p.name}</div>
            <div className="font-display text-[22px] font-black text-accent-ink leading-none">
              S/ {(payNowUnit * qty).toFixed(2)}
            </div>
          </div>
          {ctaState === 'in-cart' ? (
            <Button variant="success" size="md" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={15} aria-hidden />
              Ver carrito
            </Button>
          ) : (
            <Button
              variant="accent"
              size="md"
              disabled={ctaState === 'capped'}
              onClick={() => {
                if (ctaState !== 'idle') return
                if (addToCart(p, qty, mode) > 0) {
                  toast.success(
                    isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`,
                  )
                }
              }}
            >
              {isPreorder ? 'Reservar' : 'Agregar'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
