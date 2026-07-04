'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { useProductModalStore } from '@/features/products/stores/product-modal.store'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
// import { StarRating } from '@/shared/components/ui/StarRating' — oculto hasta tener reviews reales
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Image from 'next/image'
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
  const isPreorder = p.status === 'PREORDER'
  const isOutOfStock = p.status === 'SOLD_OUT' || (!isPreorder && p.stock === 0)
  // const isNew = p.status === 'AVAILABLE' && p.stock > 0 — solo se usaba para las estrellas ocultas
  const qtyInCart = cart.find((i) => i.product.id === p.id)?.qty ?? 0

  const discountPct =
    p.salePrice && p.salePrice < p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0
  // isNewArrival viene precalculado del server (toProductCard) — no usar
  // Date.now() en render: es impuro y el React Compiler lo rechaza.
  const isNewArrival = p.isNewArrival

  // Una sola badge visible por card, por prioridad.
  const badge = isOutOfStock
    ? { label: 'AGOTADO', className: 'bg-surface-700 text-white' }
    : p.status === 'PREORDER'
      ? { label: 'PREVENTA', className: 'bg-info text-white' }
      : discountPct > 0
        ? { label: `-${discountPct}%`, className: 'bg-danger text-white' }
        : isNewArrival
          ? { label: 'NUEVO', className: 'bg-success text-white' }
          : p.featured
            ? { label: 'TOP', className: 'bg-(--gold) text-black' }
            : null

  return (
    <div
      className={`pcard${noAnimation ? '' : ' animate-fade-up'}`}
      onClick={() => openProductModal(p)}
    >
      <div className="relative">
        <div className={`${stripe} h-55 flex items-center justify-center`}>
          {p.imageUrl ? (
            <Image src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" fill />
          ) : (
            <span className="font-mono text-[10px] tracking-[2px] uppercase text-muted">
              {catLabel}
            </span>
          )}
        </div>
        {showBadge && badge && (
          <div
            className={`absolute top-3 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-1.25 ${badge.className}`}
          >
            {badge.label}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-3.5">
        <div className="text-[10px] tracking-[2px] uppercase mb-1.25 text-muted">{catLabel}</div>
        <div className="font-display text-[21px] font-black uppercase leading-[1.05] mb-3 tracking-[-0.5px] line-clamp-2 min-h-11">
          {p.name}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-[26px] font-black text-(--gold)">
            S/ {(p.salePrice && p.salePrice < p.price ? p.salePrice : p.price).toFixed(2)}
            {p.salePrice && p.salePrice < p.price && (
              <span className="ml-2 text-[14px] font-normal text-muted line-through">
                S/ {p.price.toFixed(2)}
              </span>
            )}
          </div>
          {/* Estrellas ocultas hasta tener sistema de reviews real
          <div className="text-[11px] text-muted">
            <StarRating value={isNew ? 4.5 : 4.0} size={11} className="text-(--gold)" />
          </div>
          */}
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
                  toast.success(`"${p.name}" — ${qtyInCart - 1} en el carrito`)
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
                toast.success(`"${p.name}" agregado — ${qtyInCart + 1} en el carrito`)
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
                toast.success(
                  isPreorder ? `"${p.name}" reservado` : `"${p.name}" agregado al carrito`,
                )
              }
            }}
          >
            {isOutOfStock ? (
              'Sin stock'
            ) : (
              <>
                <ShoppingCart size={15} />
                {isPreorder ? 'Reservar ahora' : 'Agregar al carrito'}
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
