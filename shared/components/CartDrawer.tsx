'use client'

import { CAT_STRIPE } from '@/features/products/data/products'
import { Button } from '@/shared/components/ui/Button'
import { useStore } from '@/shared/lib/store-context'
import { Minus, Plus, X } from 'lucide-react'
import { useEffect } from 'react'

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeItem } = useStore()
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false)
    }
    if (cartOpen) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [cartOpen, setCartOpen])

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
            Carrito <span className="text-(--gold)">({cart.length})</span>
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
                <div className={`${CAT_STRIPE[item.product.cat]} w-17.5 h-17.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] font-extrabold uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.product.name}
                  </div>
                  <div className="text-(--gold) font-display text-[20px] font-extrabold mt-px">
                    ${item.product.price.toFixed(2)}
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
                  onClick={() => removeItem(item.product.id)}
                  className="self-start"
                >
                  <X size={14} />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-7 py-6 border-t border-(--bd)">
            <div className="flex justify-between items-baseline mb-5">
              <span className="text-[12px] uppercase tracking-[1px] text-muted">Total</span>
              <span className="font-display text-[38px] font-black text-(--gold)">
                ${total.toFixed(2)}
              </span>
            </div>
            <Button variant="accent" size="lg" full>
              Finalizar compra →
            </Button>
            <div className="text-center mt-3 text-[12px] text-muted">
              Envío gratis en pedidos +$75
            </div>
          </div>
        )}
      </div>
    </>
  )
}
