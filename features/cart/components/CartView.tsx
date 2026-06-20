'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowLeft, CreditCard, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 15

export function CartView() {
  const { cart, updateQty, removeItem } = useCartStore()
  const router = useRouter()
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  const shippingFree = subtotal >= SHIPPING_THRESHOLD
  const shipping = shippingFree ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  /* ── Empty state ─────────────────────────────────── */
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 pt-[calc(var(--nh)+36px)]">
        <div className="text-[72px] opacity-20 select-none">
          <ShoppingBag size={96} strokeWidth={1} />
        </div>
        <div className="text-center">
          <h1 className="font-display text-[32px] font-black uppercase tracking-tight mb-2">
            Tu carrito está vacío
          </h1>
          <p className="text-muted text-[14px]">
            Explora el catálogo y agrega productos para continuar.
          </p>
        </div>
        <Link href="/catalogo">
          <Button variant="accent" size="lg">
            Ver catálogo
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 pt-[calc(var(--nh)+36px)] pb-12 max-w-360 mx-auto">
        {/* ── Page header ── */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="text-muted hover:text-(--gold) transition-colors duration-200"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-[32px] font-black uppercase tracking-tight">
            Mi Carrito <span className="text-(--gold)">({itemCount})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── Items list ──────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {cart.map((item) => {
              const stripe = getCategoryStripe(item.product.category.slug)
              const catLabel = getCategoryLabel(item.product.category.slug)
              const lineTotal = item.product.price * item.qty

              return (
                <div
                  key={item.product.id}
                  className="flex gap-5 p-5 bg-(--surf) border border-(--bd) items-center"
                >
                  {/* Image / stripe */}
                  <Link
                    href={`/catalogo/${item.product.slug}`}
                    className="shrink-0 block w-24 h-24 overflow-hidden"
                  >
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`${stripe} w-full h-full`} />
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[2px] uppercase text-muted mb-1">
                      {catLabel} · {item.product.brand.name}
                    </div>
                    <Link href={`/catalogo/${item.product.slug}`}>
                      <div className="font-display text-[18px] font-black uppercase leading-tight hover:text-(--gold) transition-colors duration-150 truncate">
                        {item.product.name}
                      </div>
                    </Link>
                    <div className="text-(--gold) font-display text-[15px] font-bold mt-0.5">
                      {formatCurrency(item.product.price)} c/u
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-(--bd) bg-background">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          disabled={item.qty <= 1}
                          className="px-3 py-2 text-muted hover:text-white disabled:opacity-30 transition-colors duration-150"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-display font-extrabold text-[15px] min-w-8 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="px-3 py-2 text-muted hover:text-white transition-colors duration-150"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setPendingRemove({ id: item.product.id, name: item.product.name })
                        }
                        className="text-muted hover:text-red-400 transition-colors duration-200"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="shrink-0 text-right">
                    <div className="font-display text-[22px] font-black text-(--gold)">
                      {formatCurrency(lineTotal)}
                    </div>
                    {item.qty > 1 && (
                      <div className="text-[11px] text-muted mt-0.5">
                        {item.qty} × {formatCurrency(item.product.price)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Order summary ────────────────────────────── */}
          <div className="lg:sticky lg:top-24 bg-(--surf) border border-(--bd) p-7 flex flex-col gap-5">
            <h2 className="font-display text-[20px] font-black uppercase tracking-tight">
              Resumen del pedido
            </h2>

            <div className="flex flex-col gap-3.5 text-[14px]">
              <div className="flex justify-between items-baseline">
                <span className="text-muted">
                  Subtotal{' '}
                  <span className="text-white/50">
                    ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
                  </span>
                </span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-muted">Envío</span>
                {shippingFree ? (
                  <span className="text-green-400 font-semibold text-[13px]">Gratis</span>
                ) : (
                  <span className="font-semibold">{formatCurrency(SHIPPING_COST)}</span>
                )}
              </div>

              {!shippingFree && (
                <div className="text-[12px] text-muted border border-(--bd) px-3.5 py-2.5 leading-relaxed">
                  Agrega{' '}
                  <span className="text-(--gold) font-semibold">
                    {formatCurrency(SHIPPING_THRESHOLD - subtotal)}
                  </span>{' '}
                  más para obtener envío gratis.
                </div>
              )}

              <div className="border-t border-(--bd) pt-3.5 flex justify-between items-baseline">
                <span className="text-[12px] uppercase tracking-[1.5px] text-muted">Total</span>
                <span className="font-display text-[34px] font-black text-(--gold) leading-none">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Button variant="accent" size="lg" full onClick={() => router.push('/checkout')}>
              <CreditCard size={16} className="mr-2" />
              Proceder al pago
            </Button>

            <Button variant="outline" size="md" full onClick={() => router.push('/catalogo')}>
              <ArrowLeft size={15} className="mr-2" /> Seguir comprando
            </Button>
          </div>
        </div>
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
    </>
  )
}
