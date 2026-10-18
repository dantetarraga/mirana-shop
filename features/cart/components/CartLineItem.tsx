'use client'

import { PreorderArrival } from '@/features/cart/components/CartPreorderNotice'
import { removeWithUndo } from '@/features/cart/lib/remove-with-undo'
import { useCartStore, type CartItem } from '@/features/cart/stores/cart.store'
import {
  canPartialPreorder,
  depositUnitPrice,
  effectiveMode,
} from '@/features/checkout/lib/preorder'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { maxPurchasable } from '@/features/products/lib/stock'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { FadeImage } from '@/shared/components/ui/FadeImage'
import { formatCurrency } from '@/shared/lib/utils'
import { Minus, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// CartLineItem — una línea del carrito, compartida por el drawer (`compact`) y
// la página /carrito (`full`). La lógica de la línea (tope de stock, adelanto
// de preventa, cantidad optimista, borrado con deshacer) vive aquí una sola
// vez; cada variante solo decide el layout.
// ---------------------------------------------------------------------------

interface CartLineItemProps {
  item: CartItem
  /** % de adelanto global de la tienda (pricingRules.preorderDepositPercent). */
  depositPercent?: number
  variant: 'compact' | 'full'
  /** Se llama al seguir un enlace de la línea (p. ej. para cerrar el drawer). */
  onNavigate?: () => void
}

/** Datos derivados de la línea — mismos criterios que splitPreorderTotals. */
function useLineModel(item: CartItem, depositPercent?: number) {
  const updateQty = useCartStore((s) => s.updateQty)
  const setLineMode = useCartStore((s) => s.setLineMode)
  const { product, qty } = item

  const fullUnit = effectivePrice(product)
  const canPartial = canPartialPreorder(product)
  const depositUnit = canPartial ? depositUnitPrice(product, depositPercent) : fullUnit
  // `effectiveMode` y no el modo crudo: si el producto dejó de admitir preventa
  // parcial, la línea se cobra completa, igual que en los totales.
  const isPartial = effectiveMode(product, item.preorderMode) === 'PARTIAL'
  // La línea muestra lo que se cobra hoy: el adelanto si es parcial.
  const unitPrice = isPartial ? depositUnit : fullUnit
  const max = maxPurchasable(product)

  return {
    product,
    qty,
    href: `/catalogo/${product.slug}`,
    stripe: getCategoryStripe(product.category.slug),
    fullUnit,
    canPartial,
    depositUnit,
    isPartial,
    unitPrice,
    lineTotal: unitPrice * qty,
    atLimit: max !== null && qty >= max,
    // Un producto puede agotarse mientras está en el carrito.
    unavailable: max === 0,
    // La UI es optimista: el store aplica el cambio al instante y lo sincroniza.
    decrement: () => updateQty(product.id, -1),
    increment: () => updateQty(product.id, 1),
    setMode: (mode: CartItem['preorderMode']) => setLineMode(product.id, mode),
    remove: () => removeWithUndo(item),
  }
}

type LineModel = ReturnType<typeof useLineModel>

function LineThumb({
  line,
  className,
  sizes,
  onNavigate,
}: {
  line: LineModel
  className: string
  sizes: string
  onNavigate?: () => void
}) {
  return (
    <Link
      href={line.href}
      onClick={onNavigate}
      className={`relative shrink-0 overflow-hidden block bg-skeleton ${className}`}
      tabIndex={-1}
      aria-hidden
    >
      {line.product.imageUrl ? (
        <FadeImage src={line.product.imageUrl} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <div className={`${line.stripe} w-full h-full`} />
      )}
    </Link>
  )
}

function OutOfStockNotice({ line }: { line: LineModel }) {
  if (!line.unavailable) return null
  return (
    <div className="text-[11px] text-danger font-semibold mt-0.5">
      Sin stock — quitalo para continuar
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variante compacta — drawer del carrito
// ---------------------------------------------------------------------------
function CompactLine({ line, onNavigate }: { line: LineModel; onNavigate?: () => void }) {
  const { product } = line
  return (
    <div className="flex gap-3.5 items-center pb-3.5 border-b border-(--bd)">
      <LineThumb line={line} className="w-17.5 h-17.5" sizes="70px" onNavigate={onNavigate} />
      <div className="flex-1 min-w-0">
        <Link
          href={line.href}
          onClick={onNavigate}
          className="font-display text-[17px] font-extrabold uppercase whitespace-nowrap overflow-hidden text-ellipsis block hover:text-accent-ink transition-colors duration-150"
        >
          {product.name}
        </Link>
        <div className="text-accent-ink font-display text-[20px] font-extrabold mt-px">
          {formatCurrency(line.unitPrice)}
        </div>
        {line.isPartial && (
          <div className="text-[11px] text-muted">
            <span className="text-info font-semibold">Preventa parcial</span> · de{' '}
            {formatCurrency(line.fullUnit)}
          </div>
        )}
        <PreorderArrival product={product} />
        <OutOfStockNotice line={line} />
        <div className="flex items-center gap-1 mt-1.5 -ml-1">
          <Button
            variant="icon"
            size="md"
            className="border-transparent"
            disabled={line.qty <= 1}
            aria-label={`Quitar una unidad de "${product.name}"`}
            onClick={line.decrement}
          >
            <Minus size={14} aria-hidden />
          </Button>
          <span className="font-display font-extrabold min-w-6 text-center">{line.qty}</span>
          <Button
            variant="icon"
            size="md"
            className="border-transparent"
            disabled={line.atLimit}
            aria-label={`Agregar una unidad de "${product.name}"`}
            onClick={line.increment}
          >
            <Plus size={14} aria-hidden />
          </Button>
        </div>
      </div>
      <Button
        variant="icon"
        size="md"
        destructive
        aria-label={`Eliminar "${product.name}" del carrito`}
        onClick={line.remove}
        className="self-start border-transparent -mr-2"
      >
        <X size={16} aria-hidden />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variante completa — página /carrito
// ---------------------------------------------------------------------------
function FullLine({ line, onNavigate }: { line: LineModel; onNavigate?: () => void }) {
  const { product } = line
  const modeOptions = [
    { mode: 'FULL' as const, label: 'Pago total', amount: line.fullUnit },
    { mode: 'PARTIAL' as const, label: 'Adelanto', amount: line.depositUnit },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 bg-(--surf) border border-(--bd) sm:items-center">
      <div className="flex gap-4 sm:gap-5 sm:flex-1 min-w-0">
        <LineThumb
          line={line}
          className="w-20 h-20 sm:w-24 sm:h-24"
          sizes="96px"
          onNavigate={onNavigate}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] tracking-[2px] uppercase text-muted mb-1">
            {product.category.name} · {product.brand.name}
          </div>
          <Link
            href={line.href}
            onClick={onNavigate}
            className="block font-display text-[16px] sm:text-[18px] font-black uppercase leading-tight hover:text-accent-ink transition-colors duration-150 truncate"
          >
            {product.name}
          </Link>
          <div className="text-accent-ink font-display text-[15px] font-bold mt-0.5">
            {formatCurrency(line.unitPrice)} c/u
          </div>
          <PreorderArrival product={product} className="mt-0.5 text-[12px]" />
          <OutOfStockNotice line={line} />

          {/* Preventa: se puede alternar entre pagar todo y pagar solo el
              adelanto sin volver a la ficha del producto. */}
          {line.canPartial && (
            <div className="flex items-center border border-(--bd) w-fit mt-2">
              {modeOptions.map((opt) => {
                const selected = (line.isPartial ? 'PARTIAL' : 'FULL') === opt.mode
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => line.setMode(opt.mode)}
                    aria-pressed={selected}
                    className={`px-3 min-h-11 text-[11px] tracking-[1px] uppercase font-display font-extrabold transition-colors duration-150 ${
                      selected ? 'bg-(--gold) text-on-accent' : 'text-muted hover:text-text'
                    }`}
                  >
                    {opt.label} · {formatCurrency(opt.amount)}
                  </button>
                )
              })}
            </div>
          )}

          {/* Qty controls */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center border border-(--bd) bg-bg">
              <button
                type="button"
                onClick={line.decrement}
                disabled={line.qty <= 1}
                className="w-11 h-11 flex items-center justify-center text-muted hover:text-text disabled:opacity-30 transition-colors duration-150"
                aria-label={`Quitar una unidad de "${product.name}"`}
              >
                <Minus size={13} aria-hidden />
              </button>
              <span
                className="font-display font-extrabold text-[15px] min-w-8 text-center"
                aria-live="polite"
              >
                {line.qty}
              </span>
              <button
                type="button"
                onClick={line.increment}
                disabled={line.atLimit}
                className="w-11 h-11 flex items-center justify-center text-muted hover:text-text disabled:opacity-30 transition-colors duration-150"
                aria-label={`Agregar una unidad de "${product.name}"`}
              >
                <Plus size={13} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={line.remove}
              className="w-11 h-11 flex items-center justify-center text-muted hover:text-danger transition-colors duration-200"
              aria-label={`Eliminar "${product.name}" del carrito`}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Line total */}
      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center shrink-0 pt-3 sm:pt-0 border-t border-(--bd) sm:border-t-0">
        <div className="font-display text-[20px] sm:text-[22px] font-black text-accent-ink">
          {formatCurrency(line.lineTotal)}
        </div>
        {line.qty > 1 && (
          <div className="text-[11px] text-muted sm:mt-0.5">
            {line.qty} × {formatCurrency(line.unitPrice)}
          </div>
        )}
      </div>
    </div>
  )
}

export function CartLineItem({ item, depositPercent, variant, onNavigate }: CartLineItemProps) {
  const line = useLineModel(item, depositPercent)
  return variant === 'compact' ? (
    <CompactLine line={line} onNavigate={onNavigate} />
  ) : (
    <FullLine line={line} onNavigate={onNavigate} />
  )
}
