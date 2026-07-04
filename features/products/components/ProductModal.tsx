'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { useProductModalStore } from '@/features/products/stores/product-modal.store'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ArrowRight, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function ProductModal() {
  const { activeProduct: p, closeProductModal } = useProductModalStore()
  const { addToCart } = useCartStore()
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

  const isPreorder = p.status === 'PREORDER'

  return (
    <div
      onClick={closeProductModal}
      className="fixed inset-0 z-300 bg-black/82 backdrop-blur-[10px] flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surf border border-(--bd) max-w-220 w-full max-h-[92vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 relative"
      >
        {/* Image */}
        <div
          className={`${getCategoryStripe(p.category.slug)} min-h-70 sm:min-h-110 flex items-center justify-center relative`}
        >
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div className="font-mono text-[12px] tracking-[2px] text-muted uppercase">
              {p.name.toUpperCase()}
            </div>
          )}
          <Button
            variant="icon"
            size="md"
            onClick={closeProductModal}
            className="absolute top-4 right-4 z-10"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Info */}
        <div className="p-5 sm:p-11 flex flex-col gap-4.5">
          <div>
            <div className="text-[10px] tracking-[3px] uppercase text-muted">
              {p.category.name} · {p.brand.name}
            </div>
            <div className="font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(28px,4vw,48px)]">
              {p.name}
            </div>
          </div>

          <div className="font-display text-[38px] sm:text-[52px] font-black text-(--gold) leading-none">
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
              toast.success(
                isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`,
              )
              closeProductModal()
            }}
          >
            {isPreorder ? 'Reservar ahora' : 'Agregar al carrito'} · S/ {(p.price * qty).toFixed(2)}
          </Button>

          <Link
            href={`/catalogo/${p.slug}`}
            onClick={closeProductModal}
            className="inline-flex justify-center items-center w-full text-center border border-(--bd) px-6 py-3 text-[12px] tracking-[2px] uppercase font-display font-extrabold hover:border-(--gold) hover:text-(--gold) transition-colors duration-300"
          >
            Ver detalles del producto
            <ArrowRight className="ml-1" size={14} strokeWidth={3} />
          </Link>

          <Button variant="ghost" size="lg" full onClick={closeProductModal}>
            Seguir explorando
          </Button>
        </div>
      </div>
    </div>
  )
}
