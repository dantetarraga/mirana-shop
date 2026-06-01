'use client'

import { placeOrder } from '@/features/orders/actions/checkout.actions'
import { Button } from '@/shared/components/ui/Button'
import { checkoutSchema, type CheckoutInput } from '@/shared/lib/schemas'
import { useStore } from '@/shared/lib/store-context'
import { formatCurrency } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Home,
  Loader2,
  MessageCircle,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 15

const PAYMENT_METHODS = [
  {
    value: 'WHATSAPP_TRANSFER',
    label: 'Transferencia / Depósito',
    desc: 'Realiza el pago y envíanos tu comprobante por WhatsApp para confirmar tu pedido.',
    icon: MessageCircle,
    available: true,
  },
  {
    value: 'CULQI_YAPE',
    label: 'Yape',
    desc: 'Pago con Yape escaneando el código QR.',
    icon: Smartphone,
    available: true,
  },
  {
    value: 'CULQI_CARD',
    label: 'Tarjeta de crédito / débito',
    desc: 'Visa, Mastercard — pago seguro con Culqi.',
    icon: CreditCard,
    available: true,
  },
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SuccessItem = {
  name: string
  qty: number
  unitPrice: number
}

type SuccessData = {
  code: string
  paymentMethod: string
  items: SuccessItem[]
  subtotal: number
  shippingCost: number
  total: number
  culqi?:
    | {
        orderId: string
        qrUrl: string | null
        peUrl: string | null
        paymentCode: string | null
      }
    | undefined
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const { cart, user, removeItem: _removeItem, setCartOpen: _so } = useStore()
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [loading, setLoading] = useState(false)

  // Cart calculations
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shippingFree = subtotal >= SHIPPING_THRESHOLD
  const shippingCost = shippingFree ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      address: '',
      district: '',
      city: 'Lima',
      reference: '',
      paymentMethod: 'WHATSAPP_TRANSFER',
    },
  })

  // Redirect to cart if empty (and not in success state)
  if (cart.length === 0 && !success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingBag size={80} strokeWidth={1} className="opacity-15" />
        <p className="text-[15px] text-muted">Tu carrito está vacío.</p>
        <Link href="/catalogo">
          <Button variant="accent" size="md">
            <ShoppingCart size={15} className="mr-2" />
            Ver catálogo
          </Button>
        </Link>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (success) {
    return <SuccessScreen data={success} />
  }

  // ---------------------------------------------------------------------------
  // Checkout form
  // ---------------------------------------------------------------------------

  const onSubmit = async (data: CheckoutInput) => {
    if (loading) return
    setLoading(true)

    const items = cart.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      productSku: i.product.sku,
      quantity: i.qty,
      unitPrice: i.product.price,
    }))

    const result = await placeOrder({ form: data, items, subtotal, shippingCost, total })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    // Capturamos resumen antes de limpiar el carrito
    const successItems = cart.map((i) => ({
      name: i.product.name,
      qty: i.qty,
      unitPrice: i.product.price,
    }))

    // Clear cart items
    cart.forEach((i) => _removeItem(i.product.id))
    setSuccess({
      code: result.data.code,
      paymentMethod: result.data.paymentMethod,
      items: successItems,
      subtotal,
      shippingCost,
      total,
      culqi: result.data.culqi,
    })
  }

  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+36px)] pb-16">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Tienda</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
          Finalizar compra
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── Left column ──────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* Datos de entrega */}
            <section className="bg-card border border-(--bd) p-6">
              <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
                Datos de entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre y apellido" error={errors.fullName?.message} span={2}>
                  <input {...register('fullName')} className={input} placeholder="Juan García" />
                </Field>

                <Field label="Correo electrónico" error={errors.email?.message}>
                  <input
                    {...register('email')}
                    type="email"
                    className={input}
                    placeholder="tu@correo.com"
                  />
                </Field>

                <Field label="Teléfono / Celular" error={errors.phone?.message}>
                  <input
                    {...register('phone')}
                    type="tel"
                    className={input}
                    placeholder="+51 999 999 999"
                  />
                </Field>

                <Field label="Dirección" error={errors.address?.message} span={2}>
                  <input
                    {...register('address')}
                    className={input}
                    placeholder="Av. Principal 123, Dpto. 4B"
                  />
                </Field>

                <Field label="Distrito" error={errors.district?.message}>
                  <input {...register('district')} className={input} placeholder="Miraflores" />
                </Field>

                <Field label="Ciudad" error={errors.city?.message}>
                  <input {...register('city')} className={input} placeholder="Lima" />
                </Field>

                <Field label="Referencia (opcional)" error={errors.reference?.message} span={2}>
                  <input
                    {...register('reference')}
                    className={input}
                    placeholder="Frente al parque, puerta roja..."
                  />
                </Field>
              </div>
            </section>

            {/* Método de pago */}
            <section className="bg-card border border-(--bd) p-6">
              <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
                Método de pago
              </h2>

              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map(({ value, label, desc, icon: Icon, available }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-4 border p-4 cursor-pointer transition-colors duration-150 ${
                      available
                        ? 'border-(--bd) hover:border-(--gold)/60'
                        : 'border-(--bd) opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value={value}
                      disabled={!available}
                      className="mt-0.5 accent-(--gold) w-4 h-4 shrink-0"
                    />
                    <Icon size={18} className="mt-0.5 shrink-0 text-(--gold)" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-[14px] uppercase tracking-tight">
                          {label}
                        </span>
                        {!available && (
                          <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                            Próximamente
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted mt-0.5 leading-snug">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {errors.paymentMethod && (
                <p className="text-red-500 text-[12px] mt-2">{errors.paymentMethod.message}</p>
              )}
            </section>
          </div>

          {/* ── Right column: sticky summary ─────────────── */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <div className="bg-card border border-(--bd) p-6">
              <h2 className="font-display font-black uppercase text-[13px] tracking-[2px] text-(--gold) mb-4">
                Resumen del pedido
              </h2>

              {/* Items */}
              <ul className="flex flex-col gap-3 mb-5 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex gap-3 items-start">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-surf border border-(--bd) shrink-0 overflow-hidden">
                      {item.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full stripe-fig" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-[13px] uppercase leading-tight truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {item.qty} × {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <span className="font-semibold text-[13px] shrink-0">
                      {formatCurrency(item.product.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="border-t border-(--bd) pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Envío</span>
                  {shippingFree ? (
                    <span className="text-emerald-400 font-semibold text-[12px] uppercase tracking-wide">
                      Gratis
                    </span>
                  ) : (
                    <span>{formatCurrency(shippingCost)}</span>
                  )}
                </div>

                {!shippingFree && (
                  <p className="text-[11px] text-muted leading-snug">
                    Agrega{' '}
                    <span className="text-white font-semibold">
                      {formatCurrency(SHIPPING_THRESHOLD - subtotal)}
                    </span>{' '}
                    más para envío gratis.
                  </p>
                )}

                <div className="flex justify-between font-display font-black text-[18px] uppercase tracking-tight border-t border-(--bd) pt-3 mt-1">
                  <span>Total</span>
                  <span className="text-(--gold)">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button type="submit" variant="accent" size="lg" full disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Truck size={16} className="mr-2" />
                  Confirmar pedido
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              full
              onClick={() => window.history.back()}
              disabled={loading}
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Volver al carrito
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen({ data }: { data: SuccessData }) {
  const isTransfer = data.paymentMethod === 'WHATSAPP_TRANSFER'
  const isYape = data.paymentMethod === 'CULQI_YAPE'

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-130 w-full flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 bg-(--gold)/10 border border-(--gold)/30 flex items-center justify-center">
          <BadgeCheck size={44} className="text-(--gold)" />
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">
            ¡Pedido recibido!
          </p>
          <h1 className="font-display font-black uppercase text-[30px] tracking-tight leading-none">
            Gracias por tu compra
          </h1>
        </div>

        {/* Order code */}
        <div className="bg-card border border-(--bd) w-full px-6 py-5 text-center">
          <p className="text-[10px] tracking-[3px] uppercase text-muted mb-2">Número de pedido</p>
          <p className="font-display font-black text-[28px] tracking-[3px] text-(--gold)">
            {data.code}
          </p>
          <p className="text-[12px] text-muted mt-1">
            Guarda este código para hacer seguimiento de tu pedido.
          </p>
        </div>

        {/* Resumen de productos */}
        <div className="bg-card border border-(--bd) w-full">
          <div className="px-6 py-4 border-b border-(--bd)">
            <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">Resumen del pedido</p>
          </div>
          <ul className="flex flex-col divide-y divide-(--bd)">
            {data.items.map((item, i) => (
              <li key={i} className="flex justify-between items-center px-6 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[13px] uppercase leading-tight truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {item.qty} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-semibold text-[13px] shrink-0">
                  {formatCurrency(item.unitPrice * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-6 py-4 border-t border-(--bd) flex flex-col gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Subtotal</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Envío</span>
              {data.shippingCost === 0 ? (
                <span className="text-emerald-400 font-semibold text-[12px] uppercase">Gratis</span>
              ) : (
                <span>{formatCurrency(data.shippingCost)}</span>
              )}
            </div>
            <div className="flex justify-between font-display font-black text-[17px] uppercase tracking-tight border-t border-(--bd) pt-2 mt-1">
              <span>Total pagado</span>
              <span className="text-(--gold)">{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>

        {/* Yape QR */}
        {isYape && data.culqi && (
          <div className="bg-surf border border-(--bd) w-full px-6 py-5 flex flex-col items-center gap-4">
            <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">Paga con Yape</p>

            {data.culqi.qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.culqi.qrUrl}
                alt="Código QR para pagar con Yape"
                className="w-44 h-44 object-contain border border-(--bd) p-2"
              />
            ) : null}

            {data.culqi.paymentCode && (
              <div className="text-center">
                <p className="text-[11px] text-muted mb-1">Código de pago</p>
                <p className="font-mono font-bold text-[22px] tracking-widest text-white">
                  {data.culqi.paymentCode}
                </p>
              </div>
            )}

            <p className="text-[12px] text-muted text-center">
              Abre Yape, escanea el QR o ingresa el código de pago. El pedido se confirmará
              automáticamente.
            </p>

            {data.culqi.peUrl && (
              <a
                href={data.culqi.peUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] underline text-(--gold) hover:opacity-80"
              >
                También puedes pagar con PagoEfectivo
              </a>
            )}
          </div>
        )}

        {/* Instructions (transfer y otros) */}
        {!isYape && (
          <div className="bg-surf border border-(--bd) w-full px-6 py-5">
            <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-3">
              Próximos pasos
            </p>
            {isTransfer ? (
              <div className="flex flex-col gap-2.5 text-[13px] leading-snug">
                <Step n={1}>Realiza tu transferencia o depósito al número de cuenta indicado.</Step>
                <Step n={2}>
                  Envía tu comprobante de pago por WhatsApp al{' '}
                  <span className="font-semibold text-white">+51 987 654 321</span> junto con tu
                  código <span className="font-mono text-(--gold)">{data.code}</span>.
                </Step>
                <Step n={3}>Una vez confirmado el pago, prepararemos y enviaremos tu pedido.</Step>
              </div>
            ) : (
              <div className="text-[13px] leading-snug text-muted">
                Te contactaremos al correo registrado con las instrucciones de pago.
                <br />
                Código de referencia: <span className="font-mono text-(--gold)">{data.code}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/catalogo" className="flex-1">
            <Button variant="accent" size="md" full>
              <ShoppingCart size={15} className="mr-2" />
              Seguir comprando
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" size="md" full>
              <Home size={14} className="mr-2" />
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const input =
  'w-full bg-surf border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[11px] outline-none focus:border-(--gold)/50 transition-colors duration-150'

function Field({
  label,
  error,
  children,
  span,
}: {
  label: string
  error?: string
  children: React.ReactNode
  span?: number
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <label className="block text-[10px] tracking-[2px] uppercase text-(--gold) mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-[12px] mt-1">{error}</p>}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-5 h-5 shrink-0 bg-(--gold) text-black font-display font-black text-[11px] flex items-center justify-center">
        {n}
      </span>
      <p className="text-muted">{children}</p>
    </div>
  )
}
