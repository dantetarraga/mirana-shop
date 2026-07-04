'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowRight, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function CartDrawer() {
  const { cart, cartCount, cartOpen, setCartOpen, updateQty, removeItem } = useCartStore()
  const total = cart.reduce((s, i) => s + effectivePrice(i.product) * i.qty, 0)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false)
    }
    if (cartOpen) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [cartOpen, setCartOpen])

  useEffect(() => {
    if (!cartOpen) setPendingRemove(null)
  }, [cartOpen])

  if (!cartOpen) return null

  return (
    <>
      <div
        onClick={() => setCartOpen(false)}
        className="fixed inset-0 z-400 bg-black/65 backdrop-blur-[6px]"
      />
      <div className="fixed top-0 right-0 bottom-0 z-401 w-105 bg-surf border-l border-(--bd) flex flex-col animate-slide-right">
        {/* Header */}
        <div className="px-7 py-6 border-b border-(--bd) flex items-center justify-between">
          <div className="font-display text-[26px] font-black uppercase tracking-[1px]">
            Carrito <span className="text-(--gold)">({cartCount})</span>
          </div>
          <Button variant="icon" size="md" onClick={() => setCartOpen(false)}>
            <X size={16} />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-3.5">
          {cart.length === 0 ? (
            <div className="text-center py-16 px-5 text-muted">
              <div className="text-[52px] mb-4 opacity-25">🛒</div>
              <div className="font-display text-[22px] font-black uppercase mb-2">
                Carrito vacío
              </div>
              <div className="text-[13px]">Agrega productos para continuar</div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3.5 items-center pb-3.5 border-b border-(--bd)"
              >
                <div
                  className={`${getCategoryStripe(item.product.category.slug)} w-17.5 h-17.5 shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] font-extrabold uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.product.name}
                  </div>
                  <div className="text-(--gold) font-display text-[20px] font-extrabold mt-px">
                    {formatCurrency(effectivePrice(item.product))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="icon" size="sm" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus size={14} />
                    </Button>
                    <span className="font-display font-extrabold min-w-6 text-center">
                      {item.qty}
                    </span>
                    <Button variant="icon" size="sm" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="icon"
                  size="sm"
                  destructive
                  onClick={() => setPendingRemove({ id: item.product.id, name: item.product.name })}
                  className="self-start"
                >
                  <X size={14} />
                </Button>
              </div>
            ))
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
          <div className="px-7 py-6 border-t border-(--bd)">
            <div className="flex justify-between items-baseline mb-5">
              <span className="text-[12px] uppercase tracking-[1px] text-muted">Total</span>
              <span className="font-display text-[38px] font-black text-(--gold)">
                {formatCurrency(total)}
              </span>
            </div>
            <Button variant="accent" size="lg" full>
              <Link
                href="/carrito"
                onClick={() => setCartOpen(false)}
                className="w-full inline-flex items-center justify-center"
              >
                Ver carrito y pagar
                <ArrowRight size={14} className="ml-1" strokeWidth={3} />
              </Link>
            </Button>
            <div className="text-center mt-3 text-[12px] text-muted">
              Envío gratis en pedidos +S/ 75
            </div>
          </div>
        )}
      </div>
    </>
  )
}
