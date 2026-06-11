'use client'

import { DeliveryForm } from '@/features/checkout/components/DeliveryForm'
import { OrderSummary } from '@/features/checkout/components/OrderSummary'
import { PaymentSection } from '@/features/checkout/components/PaymentSection'
import { SavedAddressSelector } from '@/features/checkout/components/SavedAddressSelector'
import { SuccessScreen } from '@/features/checkout/components/SuccessScreen'
import type { SuccessData } from '@/features/checkout/types'
import { placeOrder } from '@/features/orders/actions/checkout.actions'
import {
  createAddress,
  getMyAddresses,
  type AddressData,
} from '@/features/users/actions/account-profile.actions'
import {
  AddressFormPanel,
  type AddressFormValues,
} from '@/features/users/components/AddressFormPanel'
import { Button } from '@/shared/components/ui/Button'
import { useUser } from '@/shared/hooks'
import { checkoutSchema, type CheckoutInput } from '@/shared/lib/schemas'
import { useStore } from '@/shared/lib/store-context'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingBag, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Culqi.js global types
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    Culqi: {
      publicKey: string
      token: { id: string; [k: string]: unknown } | null
      error: { user_message: string; [k: string]: unknown } | null
      createToken: (data: {
        card_number: string
        cvv: string
        expiration_month: string
        expiration_year: string
        email: string
      }) => void
    }
    culqi: () => void
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 15

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const { cart, removeItem: _removeItem } = useStore()
  const { user } = useUser()
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  // Card form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardError, setCardError] = useState<string | null>(null)

  // Cart calculations
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shippingFree = subtotal >= SHIPPING_THRESHOLD
  const shippingCost = shippingFree ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const selectedPayment = watch('paymentMethod')

  // Cargar direcciones guardadas si el usuario está logueado
  useEffect(() => {
    if (!user) return
    getMyAddresses(user.email).then((addrs) => {
      setSavedAddresses(addrs)
      // Pre-seleccionar la dirección predeterminada
      const def = addrs.find((a) => a.isDefault) ?? addrs[0]
      if (def) {
        setSelectedAddressId(def.id)
        setValue('fullName', def.fullName)
        setValue('phone', def.phone)
        setValue('address', def.address)
        setValue('district', def.district)
        setValue('city', def.city)
        setValue('reference', def.reference ?? '')
      }
    })
  }, [user, setValue])

  const applyAddress = (addr: AddressData) => {
    setSelectedAddressId(addr.id)
    setValue('fullName', addr.fullName)
    setValue('phone', addr.phone)
    setValue('address', addr.address)
    setValue('district', addr.district)
    setValue('city', addr.city)
    setValue('reference', addr.reference ?? '')
  }

  const clearSavedAddress = () => {
    setSelectedAddressId(null)
    setValue('fullName', user?.name ?? '')
    setValue('phone', '')
    setValue('address', '')
    setValue('district', '')
    setValue('city', 'Lima')
    setValue('reference', '')
  }

  const handleSaveNewAddress = async (data: AddressFormValues) => {
    if (!user) return
    const result = await createAddress(user.email, data)
    if (result.success && result.id) {
      toast.success('Dirección guardada en tu cuenta')
      const updatedAddrs = await getMyAddresses(user.email)
      setSavedAddresses(updatedAddrs)
      const newAddr = updatedAddrs.find((a) => a.id === result.id)
      if (newAddr) applyAddress(newAddr)
      setShowNewAddressForm(false)
    } else {
      toast.error(result.error ?? 'Error al guardar la dirección')
    }
  }

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
    setCardError(null)

    const items = cart.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      productSku: i.product.sku,
      quantity: i.qty,
      unitPrice: i.product.price,
    }))

    // ---- Tokenización Culqi.js para tarjeta ----
    let culqiTokenId: string | undefined
    if (data.paymentMethod === 'CULQI_CARD') {
      const rawNumber = cardNumber.replace(/\s/g, '')
      const [expMonth, expYearShort] = cardExpiry.split('/')
      const expYear = expYearShort ? `20${expYearShort.trim()}` : ''

      if (rawNumber.length < 13 || !expMonth || !expYear || cardCvv.length < 3) {
        setCardError('Completa los datos de tu tarjeta')
        setLoading(false)
        return
      }

      try {
        culqiTokenId = await new Promise<string>((resolve, reject) => {
          window.culqi = () => {
            if (window.Culqi.error) {
              reject(new Error(window.Culqi.error.user_message))
            } else if (window.Culqi.token) {
              resolve(window.Culqi.token.id as string)
            } else {
              reject(new Error('Error al procesar la tarjeta'))
            }
          }
          window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? ''
          window.Culqi.createToken({
            card_number: rawNumber,
            cvv: cardCvv,
            expiration_month: expMonth.trim().padStart(2, '0'),
            expiration_year: expYear,
            email: data.email,
          })
        })
      } catch (tokenErr) {
        const msg = tokenErr instanceof Error ? tokenErr.message : 'Error al tokenizar la tarjeta'
        setCardError(msg)
        setLoading(false)
        return
      }
    }

    const result = await placeOrder({
      form: data,
      items,
      subtotal,
      shippingCost,
      total,
      culqiTokenId,
    })
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
      cardNumber: result.data.cardNumber,
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
            {savedAddresses.length > 0 && (
              <>
                <SavedAddressSelector
                  addresses={savedAddresses}
                  selectedId={selectedAddressId}
                  onSelect={applyAddress}
                  onClearManual={clearSavedAddress}
                  onAddNew={user ? () => setShowNewAddressForm(true) : undefined}
                />
                {showNewAddressForm && (
                  <AddressFormPanel
                    title="Agregar y guardar dirección"
                    onSave={handleSaveNewAddress}
                    onCancel={() => setShowNewAddressForm(false)}
                  />
                )}
              </>
            )}

            <DeliveryForm register={register} errors={errors} />

            <PaymentSection
              register={register}
              errors={errors}
              selectedPayment={selectedPayment}
              card={{
                cardNumber,
                cardExpiry,
                cardCvv,
                cardError,
                setCardNumber,
                setCardExpiry,
                setCardCvv,
                setCardError,
              }}
            />
          </div>

          {/* ── Right column ───────────────────────────────── */}
          <OrderSummary
            cart={cart}
            subtotal={subtotal}
            shippingCost={shippingCost}
            shippingFree={shippingFree}
            total={total}
            loading={loading}
            shippingThreshold={SHIPPING_THRESHOLD}
          />
        </div>
      </form>

      {/* Culqi.js — carga lazy, solo cuando se necesita tokenizar */}
      <Script src="https://checkout.culqi.com/js/v4" strategy="lazyOnload" />
    </div>
  )
}
