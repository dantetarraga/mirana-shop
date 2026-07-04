'use client'

import { DeliveryForm } from '@/features/checkout/components/DeliveryForm'
import { OrderSummary } from '@/features/checkout/components/OrderSummary'
import { PaymentSection } from '@/features/checkout/components/PaymentSection'
import { SavedAddressSelector } from '@/features/checkout/components/SavedAddressSelector'
import { SuccessScreen } from '@/features/checkout/components/SuccessScreen'
import type { SuccessData } from '@/features/checkout/types'
import { placeOrder } from '@/features/checkout/actions/checkout.actions'
import {
  createAddress,
  getMyAddresses,
  type AddressData,
} from '@/features/profile/actions/account-profile.actions'
import {
  AddressFormPanel,
  type AddressFormValues,
} from '@/features/profile/components/AddressFormPanel'
import { useCartStore } from '@/features/cart/stores/cart.store'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { Button } from '@/shared/components/ui/Button'
import { useUser } from '@/shared/hooks'
import { checkoutSchema, type CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingBag, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 15

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

interface CheckoutViewProps {
  paymentAccounts: PaymentAccountData[]
  whatsappPhone: string
}

export function CheckoutView({ paymentAccounts, whatsappPhone }: CheckoutViewProps) {
  const { cart, clearCart } = useCartStore()
  const { user } = useUser()
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  // Cart calculations
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shippingFree = subtotal >= SHIPPING_THRESHOLD
  const shippingCost = shippingFree ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const {
    register,
    handleSubmit,
    setValue,
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 pt-[calc(var(--nh)+36px)]">
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
    return <SuccessScreen data={success} whatsappPhone={whatsappPhone} />
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

    const result = await placeOrder({
      form: data,
      items,
      subtotal,
      shippingCost,
      total,
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

    clearCart()
    setSuccess({
      code: result.data.code,
      paymentMethod: result.data.paymentMethod,
      items: successItems,
      subtotal,
      shippingCost,
      total,
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

            <PaymentSection register={register} errors={errors} accounts={paymentAccounts} />
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
    </div>
  )
}
