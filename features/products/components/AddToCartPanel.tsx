'use client'

import { useCartLine } from '@/features/cart/hooks/useCartLine'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { LOW_STOCK_HINT_THRESHOLD, stockLimitMessage } from '@/features/products/lib/stock'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useJustAdded } from '@/shared/hooks'
import { Check, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  product: CatalogProduct
}

export function AddToCartPanel({ product }: Props) {
  const { addToCart, updateQty, removeItem } = useCartStore()
  const { product: p, qtyInCart, isPreorder, isOutOfStock, remaining, unitPrice, hydrated } =
    useCartLine(product)
  const [chosenQty, setQty] = useState(1)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { justAdded, trigger } = useJustAdded()

  // Si el remanente baja (se agregó desde otra superficie, o cambió el stock en
  // el servidor) la cantidad elegida se recorta al vuelo. Antes quedaba en 1
  // aunque no quedara nada por llevar y el botón solo avisaba al pulsarlo.
  const qty = remaining === null ? chosenQty : Math.min(chosenQty, Math.max(1, remaining))

  const canAdd = remaining === null || remaining > 0
  const atLimit = remaining !== null && qty >= remaining
  const showLowStock =
    !isOutOfStock && !isPreorder && remaining !== null && remaining > 0 &&
    remaining <= LOW_STOCK_HINT_THRESHOLD

  const increase = () => {
    if (atLimit) {
      toast.warning(stockLimitMessage(p.name))
      return
    }
    setQty(qty + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Lo que ya está en el carrito. El PDP no lo mostraba: con 3 unidades ya
          agregadas seguía diciendo "Cantidad 1" como si no hubiera nada. */}
      {qtyInCart > 0 && (
        <div className="border border-(--bd) px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[12px] tracking-[1px] uppercase text-muted" aria-live="polite">
            En tu carrito:{' '}
            <span className="text-accent-ink font-display font-extrabold text-[15px]">
              {qtyInCart}
            </span>
          </div>
          <div className="flex items-center border border-(--bd)">
            {qtyInCart === 1 ? (
              <Button
                variant="icon"
                size="md"
                destructive
                aria-label={`Quitar "${p.name}" del carrito`}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 size={14} />
              </Button>
            ) : (
              <Button
                variant="icon"
                size="md"
                aria-label={`Quitar una unidad de "${p.name}"`}
                onClick={() => updateQty(p.id, -1)}
              >
                <Minus size={14} />
              </Button>
            )}
            <div className="w-11 text-center font-display text-[17px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-9.5">
              {qtyInCart}
            </div>
            <Button
              variant="icon"
              size="md"
              // updateQty avisa por sí solo cuando se llegó al tope.
              disabled={remaining !== null && remaining === 0}
              aria-label={`Agregar una unidad de "${p.name}"`}
              onClick={() => updateQty(p.id, 1)}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Aviso de urgencia — sobre lo que al cliente le queda por llevar, sin
          revelar la cifra. Antes se calculaba en el servidor con el stock crudo,
          así que seguía diciendo "últimas unidades" aunque ya las tuviera todas. */}
      {showLowStock && (
        <div className="text-[12px] text-[#ffb84a] font-semibold tracking-[0.5px]">
          ⚠ ¡Últimas unidades disponibles!
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
            toast.success(isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`)
            trigger()
            setQty(1)
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
          `${isPreorder ? 'Reservar' : 'Agregar al carrito'} · S/ ${(unitPrice * qty).toFixed(2)}`
        )}
      </Button>

      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          removeItem(p.id)
          toast.success(`"${p.name}" eliminado del carrito`)
          setConfirmRemove(false)
        }}
        title="¿Eliminar producto?"
        description={`"${p.name}" será eliminado de tu carrito.`}
      />
    </div>
  )
}
