'use client'

import {
  CART_KIND_LABEL,
  CART_KIND_PRODUCTS_LABEL,
  productCartKind,
} from '@/features/cart/lib/cart-kind'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { Modal } from '@/shared/components/ui/Modal'
import { ArrowRight, Repeat, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Choque de tipos de carrito — preventa vs. entrega inmediata.
//
// Se monta una sola vez (StoreOverlays) y se activa solo con el estado del
// store, así que cualquier botón "agregar al carrito" del sitio lo dispara sin
// tener que conocerlo: card, ficha, modal de producto y colecciones.
//
// Las tres salidas son las que el cliente entiende como suyas: pagar lo que ya
// armó, cambiarlo por lo nuevo, o empezar de cero. Cerrar el modal no hace nada
// (el carrito queda como estaba y el producto no entra).
// ---------------------------------------------------------------------------

interface OptionProps {
  title: string
  hint: string
  Icon: typeof ArrowRight
  onClick: () => void
  /** La opción que conserva lo que el cliente ya armó — se destaca. */
  primary?: boolean
}

function Option({ title, hint, Icon, onClick, primary = false }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 text-left border px-3.5 py-3 transition-colors duration-200 ${
        primary
          ? 'border-(--gold) bg-(--gold)/10 hover:bg-(--gold)/15'
          : 'border-(--bd) hover:border-(--bdh)'
      }`}
    >
      <Icon
        size={16}
        className={`mt-0.5 shrink-0 ${primary ? 'text-accent-ink' : 'text-muted'}`}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block font-display font-bold text-[13px] uppercase tracking-[0.5px] leading-tight">
          {title}
        </span>
        <span className="block text-[12px] text-muted mt-1 leading-snug">{hint}</span>
      </span>
    </button>
  )
}

export function CartMixModal() {
  const conflict = useCartStore((s) => s.mixConflict)
  const dismiss = useCartStore((s) => s.dismissMixConflict)
  const resolve = useCartStore((s) => s.resolveMixConflict)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const router = useRouter()

  if (!conflict) return null

  const { product, cartKind } = conflict
  const incomingKind = productCartKind(product)

  const goToCheckout = () => {
    dismiss()
    setCartOpen(false)
    router.push('/checkout')
  }

  const replaceCart = () => {
    resolve('replace')
    toast.success(`Tu carrito ahora tiene solo "${product.name}"`)
  }

  const emptyCart = () => {
    resolve('empty')
    toast.success('Carrito vaciado')
  }

  return (
    <Modal
      open
      onClose={dismiss}
      size="md"
      label="Carrito"
      title="No puedes combinar estos productos"
      description={`Tu carrito tiene ${CART_KIND_PRODUCTS_LABEL[cartKind]} y "${product.name}" es de ${CART_KIND_LABEL[incomingKind]}. Cada pedido se entrega de una sola forma, así que no pueden ir en el mismo carrito.`}
    >
      <div className="flex flex-col gap-2.5">
        <Option
          primary
          Icon={ArrowRight}
          title="Ir a pagar mi carrito"
          hint={`Continúas con lo que ya tienes. "${product.name}" no se agrega y lo puedes pedir después.`}
          onClick={goToCheckout}
        />
        <Option
          Icon={Repeat}
          title="Reemplazar mi carrito"
          hint={`Se quita todo lo que tienes y queda solo "${product.name}".`}
          onClick={replaceCart}
        />
        <Option
          Icon={Trash2}
          title="Vaciar mi carrito"
          hint="Se quita todo y empiezas de cero. Tampoco se agrega este producto."
          onClick={emptyCart}
        />
      </div>
    </Modal>
  )
}
