'use client'

import { CheckoutSteps, type CheckoutStepInfo } from '@/features/checkout/components/CheckoutSteps'
import { CouponField } from '@/features/checkout/components/CouponField'
import { DeliveryForm } from '@/features/checkout/components/DeliveryForm'
import { DeliveryMethodSelector } from '@/features/checkout/components/DeliveryMethodSelector'
import { OrderSummary } from '@/features/checkout/components/OrderSummary'
import { PaymentSection } from '@/features/checkout/components/PaymentSection'
import { SavedAddressSelector } from '@/features/checkout/components/SavedAddressSelector'
import { SuccessScreen } from '@/features/checkout/components/SuccessScreen'
import type { SuccessData } from '@/features/checkout/types'
import { placeOrder } from '@/features/checkout/actions/checkout.actions'
import {
  createAddress,
  getMyAddresses,
  getMyProfile,
  type AddressData,
} from '@/features/profile/actions/account-profile.actions'
import {
  AddressFormPanel,
  type AddressFormValues,
} from '@/features/profile/components/AddressFormPanel'
import { cartKindOf, hasMixedKinds } from '@/features/cart/lib/cart-kind'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { eligibleDeliveryMethods } from '@/features/checkout/lib/delivery-eligibility'
import {
  computeTotals,
  defaultDeliveryMethod,
  effectivePrice,
  type AppliedCoupon,
  type PricingRules,
} from '@/features/checkout/lib/pricing'
import { depositUnitPrice, splitPreorderTotals } from '@/features/checkout/lib/preorder'
import type { DeliveryMethodOption } from '@/features/delivery/types'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { Button } from '@/shared/components/ui/Button'
import { useUser } from '@/shared/hooks'
import {
  buildCheckoutSchema,
  type CheckoutFormRules,
  type CheckoutInput,
} from '@/features/checkout/schemas/checkout.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Pasos
//
// El checkout se recorre en tres pantallas en vez de un formulario largo: el
// resumen queda siempre a la vista y el botón de confirmar no se pierde abajo.
// Cada paso declara qué campos valida para poder avanzar.
// ---------------------------------------------------------------------------

type CheckoutStep = CheckoutStepInfo & { fields: (keyof CheckoutInput)[] }

const DELIVERY_STEP: CheckoutStep = {
  id: 'entrega',
  label: 'Entrega',
  icon: Truck,
  fields: ['deliveryMethodId', 'deliveryLocationId'],
}

const DATA_STEP: CheckoutStep = {
  id: 'datos',
  label: 'Tus datos',
  icon: User,
  fields: ['fullName', 'dni', 'phone', 'email', 'address', 'district', 'city', 'reference'],
}

const PAYMENT_STEP: CheckoutStep = {
  id: 'pago',
  label: 'Pago',
  icon: CreditCard,
  fields: ['paymentMethod', 'acceptTerms'],
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

interface CheckoutViewProps {
  paymentAccounts: PaymentAccountData[]
  whatsappPhone: string
  /** Reglas de precios (envío, entregas y promociones activas) del server */
  pricingRules: PricingRules
}

export function CheckoutView({ paymentAccounts, whatsappPhone, pricingRules }: CheckoutViewProps) {
  const { cart, clearCart } = useCartStore()
  const { user } = useUser()
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)

  // Un carrito es de preventa o de entrega inmediata, nunca los dos (lo impide
  // el propio carrito). De ahí sale qué entregas se pueden ofrecer: la preventa
  // se coordina y no se despacha a domicilio, así que su lista es "entrega de
  // preventa + retiro en tienda" y la del resto "envío + retiro".
  const cartKind = cartKindOf(cart.map((i) => i.product))
  const deliveryMethods = useMemo(
    () => eligibleDeliveryMethods(pricingRules.deliveryMethods, cartKind),
    [pricingRules.deliveryMethods, cartKind],
  )
  const initialMethod = defaultDeliveryMethod(deliveryMethods)

  // Se explica el filtro solo cuando algo quedó fuera: si no, el cliente ve una
  // lista más corta que en el carrito sin saber por qué.
  const deliveryHint =
    cartKind !== null && deliveryMethods.length < pricingRules.deliveryMethods.length
      ? cartKind === 'PREORDER'
        ? 'Tu pedido es de preventa: se coordina cuando llegue la mercadería, así que solo puedes elegir entre las entregas compatibles.'
        : 'Solo se muestran las formas de entrega disponibles para los productos de tu carrito.'
      : undefined

  // El esquema depende de la forma de entrega elegida (¿pide dirección?, ¿pide
  // sede?), así que el resolver lo reconstruye leyendo una ref. Con un resolver
  // recreado en cada render, react-hook-form seguiría usando el de la primera
  // llamada; con la ref siempre valida contra las reglas vigentes.
  const formRulesRef = useRef<CheckoutFormRules>({
    requiresMethod: deliveryMethods.length > 0,
    requiresAddress: initialMethod ? initialMethod.requiresAddress : true,
    requiresLocation: initialMethod
      ? initialMethod.requiresLocation && initialMethod.locations.length > 0
      : false,
  })

  const resolver = useCallback<Resolver<CheckoutInput>>(
    (values, context, options) =>
      zodResolver(buildCheckoutSchema(formRulesRef.current))(values, context, options),
    [],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver,
    defaultValues: {
      fullName: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      dni: '',
      deliveryMethodId: initialMethod?.id ?? '',
      deliveryLocationId: initialMethod?.requiresLocation
        ? (initialMethod.locations[0]?.id ?? '')
        : '',
      address: '',
      district: '',
      city: 'Lima',
      reference: '',
      couponCode: '',
      acceptTerms: false,
      paymentMethod: 'WHATSAPP_TRANSFER',
    },
  })

  const deliveryMethodId = watch('deliveryMethodId') ?? ''
  const deliveryLocationId = watch('deliveryLocationId') ?? ''
  const selectedMethod = deliveryMethods.find((m) => m.id === deliveryMethodId) ?? null

  // Sin métodos configurados el checkout se comporta como antes: pide dirección
  // y cobra el envío base de la configuración de la tienda.
  const requiresAddress = selectedMethod ? selectedMethod.requiresAddress : true
  const requiresLocation = selectedMethod
    ? selectedMethod.requiresLocation && selectedMethod.locations.length > 0
    : false

  useEffect(() => {
    formRulesRef.current = {
      requiresMethod: deliveryMethods.length > 0,
      requiresAddress,
      requiresLocation,
    }
  }, [deliveryMethods.length, requiresAddress, requiresLocation])

  const handleSelectMethod = useCallback(
    (method: DeliveryMethodOption) => {
      setValue('deliveryMethodId', method.id)
      // Preselecciona la primera sede si el método la exige; si no, la limpia
      // para no arrastrar la de un método anterior.
      setValue('deliveryLocationId', method.requiresLocation ? (method.locations[0]?.id ?? '') : '')
      clearErrors(['deliveryMethodId', 'deliveryLocationId'])
      if (!method.requiresAddress) clearErrors(['address', 'district', 'city'])
    },
    [setValue, clearErrors],
  )

  // El carrito se hidrata después del primer pintado, así que la preselección
  // inicial se hizo sobre la lista sin filtrar. Cuando ya se sabe de qué tipo
  // es el carrito (o cambia porque se vació una línea), la entrega elegida
  // puede haber desaparecido de la lista: se vuelve a la primera vigente.
  useEffect(() => {
    if (deliveryMethods.length === 0) return
    if (deliveryMethods.some((m) => m.id === deliveryMethodId)) return
    const next = defaultDeliveryMethod(deliveryMethods)
    if (next) handleSelectMethod(next)
  }, [deliveryMethods, deliveryMethodId, handleSelectMethod])

  // ── Navegación por pasos ────────────────────────────────────────────────
  // Sin formas de entrega configuradas el primer paso no tendría nada que
  // mostrar, así que en ese caso el checkout se recorre en dos pantallas.
  const steps = useMemo<CheckoutStep[]>(
    () =>
      deliveryMethods.length > 0
        ? [DELIVERY_STEP, DATA_STEP, PAYMENT_STEP]
        : [DATA_STEP, PAYMENT_STEP],
    [deliveryMethods.length],
  )

  const [step, setStep] = useState(0)
  // La lista de pasos se acorta después de hidratar el carrito: sin el clamp
  // el índice guardado podría quedar fuera de rango y no renderizar nada.
  const current = Math.min(step, steps.length - 1)
  const activeStep = steps[current]
  const isFirstStep = current === 0
  const isLastStep = current === steps.length - 1

  const stepsRef = useRef<HTMLDivElement>(null)
  const scrollToSteps = useCallback(() => {
    stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /**
   * Cambia de paso. Retroceder es libre; avanzar valida todos los pasos que
   * quedan por detrás y se detiene en el primero que tenga algo pendiente.
   */
  const goToStep = useCallback(
    async (target: number) => {
      const clamped = Math.max(0, Math.min(target, steps.length - 1))

      for (let i = current; i < clamped; i++) {
        const valid = await trigger(steps[i].fields)
        if (!valid) {
          setStep(i)
          scrollToSteps()
          return
        }
      }

      setStep(clamped)
      scrollToSteps()
    },
    [current, steps, trigger, scrollToSteps],
  )

  // Si al confirmar queda un error en un paso que no está a la vista, se salta
  // a ese paso: si no, el pedido "no hace nada" y el cliente no ve por qué.
  const onInvalid = useCallback(
    (formErrors: FieldErrors<CheckoutInput>) => {
      const failing = steps.findIndex((s) => s.fields.some((f) => formErrors[f]))
      if (failing >= 0 && failing !== current) {
        setStep(failing)
        scrollToSteps()
        toast.error('Falta completar algún dato antes de confirmar tu pedido.')
      }
    },
    [steps, current, scrollToSteps],
  )

  // Totales con precio efectivo (oferta si existe) + promociones y cupón.
  // El servidor recalcula y valida todo esto de nuevo en placeOrder.
  const { subtotal, payableNow, dueTotal } = splitPreorderTotals(
    cart,
    pricingRules.preorderDepositPercent,
  )
  const { shippingFree, shippingCost, discount, discountName, couponCode, total } = computeTotals(
    payableNow,
    pricingRules,
    { shippingCost: selectedMethod?.cost, coupon },
  )

  // Prellenar el DNI con el de la cuenta: ya lo dio al registrarse
  useEffect(() => {
    if (!user) return
    getMyProfile().then((profile) => {
      if (profile?.dni) setValue('dni', profile.dni)
    })
  }, [user, setValue])

  // Cargar direcciones guardadas si el usuario está logueado
  useEffect(() => {
    if (!user) return
    getMyAddresses().then((addrs) => {
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
    const result = await createAddress(data)
    if (result.success && result.id) {
      toast.success('Dirección guardada en tu cuenta')
      const updatedAddrs = await getMyAddresses()
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
    return <SuccessScreen data={success} whatsappPhone={whatsappPhone} accounts={paymentAccounts} />
  }

  // ---------------------------------------------------------------------------
  // Checkout form
  // ---------------------------------------------------------------------------

  const onSubmit = async (data: CheckoutInput) => {
    if (loading) return

    // Enter dentro de un input envía el formulario: si el cliente todavía no
    // llegó al último paso, eso avanza en vez de comprar.
    if (!isLastStep) {
      void goToStep(current + 1)
      return
    }

    // Red de seguridad: el carrito no deja mezclar preventa con el resto, pero
    // si algo se coló (dos pestañas escribiendo el mismo carrito) se corta acá
    // con un mensaje claro en vez de dejar que el servidor rechace el pedido.
    if (hasMixedKinds(cart.map((i) => i.product))) {
      toast.error(
        'Tu carrito mezcla productos de preventa con productos de entrega inmediata. Deja solo uno de los dos tipos para continuar.',
      )
      return
    }

    setLoading(true)

    // Solo id, cantidad y forma de pago: los precios, promociones y la validez
    // del modo de preventa los recalcula el servidor.
    const items = cart.map((i) => ({
      productId: i.product.id,
      quantity: i.qty,
      preorderMode: i.preorderMode,
    }))

    const result = await placeOrder({
      form: { ...data, couponCode: coupon?.code ?? '' },
      items,
      clientTotal: total,
    })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    // Capturamos resumen antes de limpiar el carrito (montos: los del server).
    // En las líneas parciales se muestra el adelanto, que es lo que se cobra.
    const successItems = cart.map((i) => ({
      name: i.product.name,
      qty: i.qty,
      unitPrice:
        i.preorderMode === 'PARTIAL'
          ? depositUnitPrice(i.product, pricingRules.preorderDepositPercent)
          : effectivePrice(i.product),
    }))

    clearCart()
    setSuccess({
      code: result.data.code,
      paymentMethod: result.data.paymentMethod,
      items: successItems,
      subtotal: result.data.subtotal,
      discount: result.data.discount,
      discountName: result.data.discountName,
      couponCode: result.data.couponCode,
      shippingCost: result.data.shippingCost,
      deliveryLabel: result.data.deliveryLabel,
      deliveryLocation: result.data.deliveryLocation,
      total: result.data.total,
      dueTotal: result.data.dueTotal,
    })
  }

  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+36px)] pb-16">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[3px] uppercase text-accent-ink mb-1">Tienda</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
          Finalizar compra
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* ── Left column — un paso por vez ─────────────── */}
          <div className="flex flex-col gap-6">
            <div ref={stepsRef} className="scroll-mt-[calc(var(--nh)+24px)]">
              <CheckoutSteps steps={steps} current={current} onSelect={(i) => void goToStep(i)} />
            </div>

            {activeStep.id === 'entrega' && (
              <DeliveryMethodSelector
                methods={deliveryMethods}
                selectedId={deliveryMethodId}
                onSelect={handleSelectMethod}
                selectedLocationId={deliveryLocationId}
                onSelectLocation={(id) => {
                  setValue('deliveryLocationId', id)
                  clearErrors('deliveryLocationId')
                }}
                hint={deliveryHint}
                methodError={errors.deliveryMethodId?.message}
                locationError={errors.deliveryLocationId?.message}
              />
            )}

            {activeStep.id === 'datos' && (
              <>
                {requiresAddress && savedAddresses.length > 0 && (
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

                <DeliveryForm
                  register={register}
                  errors={errors}
                  requiresAddress={requiresAddress}
                />
              </>
            )}

            {activeStep.id === 'pago' && (
              <PaymentSection
                register={register}
                errors={errors}
                accounts={paymentAccounts}
                whatsappPhone={whatsappPhone}
              />
            )}

            {/* En móvil el resumen queda debajo del paso: sin esto habría que
                pasarlo entero de largo solo para avanzar. En el último paso no
                se repite — ahí se confirma desde el resumen, que es donde están
                el total y los términos. */}
            {!isLastStep && (
              <div className="flex gap-3 lg:hidden">
                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    full
                    onClick={() => void goToStep(current - 1)}
                  >
                    <ArrowLeft size={14} className="mr-1.5" />
                    Atrás
                  </Button>
                )}
                <Button
                  type="button"
                  variant="accent"
                  size="md"
                  full
                  onClick={() => void goToStep(current + 1)}
                >
                  Continuar
                  <ArrowRight size={15} className="ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* ── Right column ───────────────────────────────── */}
          <OrderSummary
            cart={cart}
            subtotal={subtotal}
            payableNow={payableNow}
            dueTotal={dueTotal}
            depositPercent={pricingRules.preorderDepositPercent}
            shippingCost={shippingCost}
            shippingFree={shippingFree}
            discount={discount}
            discountName={discountName}
            couponCode={couponCode}
            total={total}
            loading={loading}
            shippingThreshold={pricingRules.freeShippingThreshold}
            deliveryLabel={selectedMethod?.name ?? null}
            registerTerms={register('acceptTerms')}
            termsError={errors.acceptTerms?.message}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onNext={() => void goToStep(current + 1)}
            onBack={() => void goToStep(current - 1)}
            couponSlot={
              <CouponField
                coupon={coupon}
                onApply={setCoupon}
                onRemove={() => setCoupon(null)}
                subtotal={payableNow}
                disabled={loading}
              />
            }
          />
        </div>
      </form>
    </div>
  )
}
