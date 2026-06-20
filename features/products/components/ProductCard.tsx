'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { useProductModalStore } from '@/features/products/stores/product-modal.store'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { StarRating } from '@/shared/components/ui/StarRating'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ProductCardProps {
  product: CatalogProduct
  showBadge?: boolean
  noAnimation?: boolean
}

export function ProductCard({
  product: p,
  showBadge = true,
  noAnimation = false,
}: ProductCardProps) {
  const { openProductModal } = useProductModalStore()
  const { cart, addToCart, updateQty, removeItem } = useCartStore()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const stripe = getCategoryStripe(p.category.slug)
  const catLabel = getCategoryLabel(p.category.slug)
  const isOutOfStock = p.stock === 0 || p.status === 'SOLD_OUT'
  const isNew = p.status === 'AVAILABLE' && p.stock > 0
  const qtyInCart = cart.find((i) => i.product.id === p.id)?.qty ?? 0

  return (
    <div
      className={`pcard${noAnimation ? '' : ' animate-fade-up'}`}
      onClick={() => openProductModal(p)}
    >
      <div className="relative">
        <div className={`${stripe} h-55 flex items-center justify-center`}>
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-mono text-[10px] tracking-[2px] uppercase text-muted">
              {catLabel}
            </span>
          )}
        </div>
        {showBadge && p.featured && !isOutOfStock && (
          <div className="absolute top-3 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-1.25 bg-(--gold) text-black">
            DESTACADO
          </div>
        )}
        {showBadge && isOutOfStock && (
          <div className="absolute top-3 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-1.25 bg-[#ff6644]/80 text-white">
            AGOTADO
          </div>
        )}
        {showBadge && p.status === 'PREORDER' && (
          <div className="absolute top-3 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-1.25 bg-[#8b7cff] text-white">
            PREVENTA
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-3.5">
        <div className="text-[10px] tracking-[2px] uppercase mb-1.25 text-muted">{catLabel}</div>
        <div className="font-display text-[21px] font-black uppercase leading-[1.05] mb-3 tracking-[-0.5px] line-clamp-2 min-h-[44px]">
          {p.name}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-[26px] font-black text-(--gold)">
            S/ {p.price.toFixed(2)}
            {p.compareAtPrice && p.compareAtPrice > p.price && (
              <span className="ml-2 text-[14px] font-normal text-muted line-through">
                S/ {p.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted">
            <StarRating value={isNew ? 4.5 : 4.0} size={11} className="text-(--gold)" />
          </div>
        </div>
        {qtyInCart > 0 && !isOutOfStock ? (
          <div className="flex items-center border border-(--bd) w-full">
            {qtyInCart === 1 ? (
              <Button
                variant="icon"
                size="md"
                destructive
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmRemove(true)
                }}
              >
                <Trash2 size={14} />
              </Button>
            ) : (
              <Button
                variant="icon"
                size="md"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  updateQty(p.id, -1)
                }}
              >
                <Minus size={14} />
              </Button>
            )}
            <div className="flex-1 text-center font-display text-[16px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-10.5">
              {qtyInCart}
            </div>
            <Button
              variant="icon"
              size="md"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                updateQty(p.id, 1)
              }}
            >
              <Plus size={14} />
            </Button>
          </div>
        ) : (
          <Button
            variant="accent"
            size="md"
            className="add-btn w-full"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation()
              if (!isOutOfStock) {
                addToCart(p, 1)
                toast.success(`"${p.name}" agregado al carrito`)
              }
            }}
          >
            {isOutOfStock ? (
              'Sin stock'
            ) : (
              <>
                <ShoppingCart size={15} />
                Agregar al carrito
              </>
            )}
          </Button>
        )}
      </div>

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
