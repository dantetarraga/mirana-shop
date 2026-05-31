'use client'

import { getCategoryStripe } from '@/shared/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { useStore } from '@/shared/lib/store-context'
import { Minus, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ProductModal() {
  const { activeProduct: p, closeProductModal, addToCart } = useStore()
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setQty(1)
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProductModal()
    }
    if (p) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [p, closeProductModal])

  if (!p) return null

  return (
    <div
      onClick={closeProductModal}
      className="fixed inset-0 z-300 bg-black/82 backdrop-blur-[10px] flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surf border border-(--bd) max-w-220 w-full max-h-[92vh] overflow-y-auto grid grid-cols-2 relative"
      >
        {/* Image */}
        <div className={`${getCategoryStripe(p.category.slug)} min-h-110 flex items-center justify-center relative`}>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="font-mono text-[12px] tracking-[2px] text-muted uppercase">{p.name.toUpperCase()}</div>
          )}
          <Button variant="icon" size="md" onClick={closeProductModal} className="absolute top-4 right-4 z-10">
            <X size={16} />
          </Button>
        </div>

        {/* Info */}
        <div className="p-11 flex flex-col gap-4.5">
          <div>
            <div className="text-[10px] tracking-[3px] uppercase text-muted">
              {p.category.name} · {p.brand.name}
            </div>
            <div className="font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(32px,4vw,48px)]">
              {p.name}
            </div>
          </div>

          <div className="font-display text-[52px] font-black text-(--gold) leading-none">
            S/ {p.price.toFixed(2)}
          </div>

          <div>
            <div className="text-[10px] tracking-[2px] uppercase text-muted mb-2.5">Cantidad</div>
            <div className="flex items-center border border-(--bd) w-fit">
              <Button variant="icon" size="md" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={14} />
              </Button>
              <div className="w-13 text-center font-display text-[20px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-10.5">
                {qty}
              </div>
              <Button variant="icon" size="md" onClick={() => setQty((q) => q + 1)}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <Button
            variant="accent"
            size="lg"
            full
            onClick={() => {
              addToCart(p, qty)
              closeProductModal()
            }}
          >
            Agregar al carrito · ${(p.price * qty).toFixed(2)}
          </Button>

          <Button variant="outline" size="lg" full onClick={closeProductModal}>
            Seguir explorando
          </Button>
        </div>
      </div>
    </div>
  )
}
