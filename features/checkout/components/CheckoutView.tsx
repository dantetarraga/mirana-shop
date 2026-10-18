'use client'

import { CheckoutAssurance } from '@/features/checkout/components/CheckoutAssurance'
import { CheckoutSkeleton } from '@/features/checkout/components/CheckoutSkeleton'
import { CheckoutSteps, type CheckoutStepInfo } from '@/features/checkout/components/CheckoutSteps'
import {
  CHECKOUT_ASIDE,
  CHECKOUT_ASSURANCE_CELL,
  CHECKOUT_BACK_LINK,
  CHECKOUT_CONTENT_CELL,
  CHECKOUT_GRID,
  CHECKOUT_PAGE,
  CHECKOUT_PANEL,
  CHECKOUT_STEPS_CELL,
  CHECKOUT_STICKY_BAR,
  CHECKOUT_SUMMARY_CELL,
  CHECKOUT_TITLE,
} from '@/features/checkout/components/checkout-layout'
import { CouponField } from '@/features/checkout/components/CouponField'
import { DeliveryForm } from '@/features/checkout/components/DeliveryForm'
import { DeliveryMethodSelector } from '@/features/checkout/components/DeliveryMethodSelector'
import { OrderSummary } from '@/features/checkout/components/OrderSummary'
import { PaymentSection } from '@/features/checkout/components/PaymentSection'
import { SavedAddressSelector } from '@/features/checkout/components/SavedAddressSelector'
import { SuccessScreen } from '@/features/checkout/components/SuccessScreen'
import type { SuccessData } from '@/features/checkout/types'
import { placeOrder } from '@/features/checkout/actions/checkout.actions'
import { defaultAddress, useSavedAddresses } from '@/features/checkout/hooks/useSavedAddresses'
import type { AddressData, ProfileData } from '@/features/profile/actions/account-profile.actions'
import { AddressFormPanel } from '@/features/profile/components/AddressFormPanel'
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
import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import { Button, buttonClass } from '@/shared/components/ui/Button'
import { useUser } from '@/shared/hooks/useUser'
import { formatCurrency } from '@/shared/lib/utils'
import {
  buildCheckoutSchema,
  type CheckoutFormRules,
  type CheckoutInput,
} from '@/features/checkout/schemas/checkout.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CreditCard, ShoppingBag, ShoppingCart, Truck, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useForm,
  type FieldErrors,
  type Resolver,
  type UseFormRegisterReturn,
} from 'react-hook-form'
import { toast } from 'sonner'
import { EmptyState } from '@/shared/components/ui/EmptyState'

// ---------------------------------------------------------------------------
// Pasos
//
// El checkout se recorre en tres pantallas en vez de un formulario largo: el
// resumen queda siempre a la vista y el botón de confirmar no se pierde abajo.
// Cada paso declara qué campos valida para poder avanzar.
// ---------------------------------------------------------------------------

type CheckoutStep = CheckoutStepInfo & {
  fields: (keyof CheckoutInput)[]
  /** CTA que lleva A este paso desde el anterior */
  continueLabel: string
  /** Enlace que vuelve A este paso desde el siguiente */
  backLabel: string
}

const DELIVERY_STEP: CheckoutStep = {
  id: 'entrega',
  label: 'Entrega',
  icon: Truck,
  fields: ['deliveryMethodId', 'deliveryLocationId'],
  continueLabel: 'Continuar a la entrega',
  backLabel: 'Volver a la entrega',
}

const DATA_STEP: CheckoutStep = {
  id: 'datos',
  label: 'Tus datos',
  icon: User,
  fields: ['fullName', 'dni', 'phone', 'email', 'address', 'district', 'city', 'reference'],
  continueLabel: 'Continuar',
  backLabel: 'Volver a tus datos',
}

const PAYMENT_STEP: CheckoutStep = {
  id: 'pago',
  label: 'Pago',
  icon: CreditCard,
  fields: ['paymentMethod', 'acceptTerms'],
  continueLabel: 'Continuar al pago',
  backLabel: 'Volver al pago',
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

interface CheckoutViewProps {
  paymentAccounts: PaymentAccountData[]
  whatsappPhone: string
  /** Reglas de precios (envío, entregas y promociones activas) del server */
  pricingRules: PricingRules
  /** Perfil de la cuenta (para el DNI) — `null` sin sesión. Viene del server. */
  initialProfile?: ProfileData | null
  /** Direcciones guardadas — `[]` sin sesión. Vienen del server. */
  initialAddresses?: AddressData[]
  /** Minutos que se aparta el stock al confirmar (ORDER_RESERVATION_TTL_MINUTES) */
  reservationMinutes: number
}

/** Sin carrito no hay nada que pagar: se invita a volver al catálogo. */
function EmptyCheckout() {
  return (
    <EmptyState
      size="page"
      icon={ShoppingBag}
      title="Tu carrito está vacío"
      description="Agrega productos desde el catálogo para finalizar una compra."
      className="min-h-[70vh] justify-center pt-9"
      action={
        <Link href="/catalogo" className={buttonClass({ variant: 'accent', size: 'lg' })}>
          <ShoppingCart size={16} aria-hidden />
          Ver catálogo
        </Link>
      }
    />
  )
}

export function CheckoutView({
  paymentAccounts,
  whatsappPhone,
  pricingRules,
  initialProfile = null,
  initialAddresses = [],
  reservationMinutes,
}: CheckoutViewProps) {
  const cart = useCartStore((s) => s.cart)
  const cartHydrated = useCartStore((s) => s.hydrated)
  const clearCart = useCartStore((s) => s.clearCart)
  const openAuth = useAuthModalStore((s) => s.openAuth)
  const router = useRouter()
  const { user } = useUser()
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  // Con sesión el server ya mandó perfil y direcciones: el formulario nace
  // relleno en vez de saltar cuando terminaban los useEffect de antes.
  const isLoggedIn = Boolean(user) || initialProfile !== null
  // Invitado según el servidor: el aviso de "inicia sesión" se decide con el
  // HTML ya renderizado, sin esperar a que NextAuth resuelva la sesión.
  const isGuest = initialProfile === null && !user

  // Quien inicia sesión desde ese aviso no recarga la página (signIn con
  // redirect:false): se vuelven a pedir perfil y direcciones al servidor, y
  // page.tsx remonta esta vista con `key` por cuenta para que el formulario
  // nazca relleno con los datos guardados.
  const serverSawGuest = initialProfile === null
  useEffect(() => {
    if (serverSawGuest && user) router.refresh()
  }, [serverSawGuest, user, router])
  const startAddress = defaultAddress(initialAddresses)
  const accountName = initialProfile?.name ?? user?.name ?? ''

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
      fullName: startAddress?.fullName ?? accountName,
      email: initialProfile?.email ?? user?.email ?? '',
      phone: startAddress?.phone ?? initialProfile?.phone ?? '',
      dni: initialProfile?.dni ?? '',
      deliveryMethodId: initialMethod?.id ?? '',
      deliveryLocationId: initialMethod?.requiresLocation
        ? (initialMethod.locations[0]?.id ?? '')
        : '',
      address: startAddress?.address ?? '',
      district: startAddress?.district ?? '',
      city: startAddress?.city ?? 'Lima',
      reference: startAddress?.reference ?? '',
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
        ? [DATA_STEP, DELIVERY_STEP, PAYMENT_STEP]
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
  const contentRef = useRef<HTMLDivElement>(null)
  // Al cambiar de paso el contenido se reemplaza y el foco caería en <body>:
  // se lleva al paso nuevo para que teclado y lector de pantalla sigan ahí.
  const scrollToSteps = useCallback(() => {
    stepsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    requestAnimationFrame(() => contentRef.current?.focus({ preventScroll: true }))
  }, [])

  /**
   * Cambia de paso. Retroceder es libre; avanzar revalida TODOS los pasos
   * anteriores —no solo el actual— y se detiene en el primero que tenga algo
   * pendiente. Hace falta porque la forma de entrega se elige después de los
   * datos y puede encender una regla de un paso ya recorrido: quien pasó por
   * "Tus datos" con un retiro en tienda preseleccionado y luego cambia a envío
   * a domicilio todavía no ha dado su dirección.
   */
  const goToStep = useCallback(
    async (target: number) => {
      const clamped = Math.max(0, Math.min(target, steps.length - 1))

      if (clamped > current) {
        for (let i = 0; i < clamped; i++) {
          const valid = await trigger(steps[i].fields)
          if (!valid) {
            setStep(i)
            scrollToSteps()
            return
          }
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

  const {
    savedAddresses,
    selectedAddressId,
    showNewAddressForm,
    setShowNewAddressForm,
    applyAddress,
    clearSavedAddress,
    saveNewAddress,
  } = useSavedAddresses({
    initialAddresses,
    setValue,
    fallbackName: accountName,
    canSave: isLoggedIn,
  })

  const assurance = (
    <CheckoutAssurance
      reservationMinutes={reservationMinutes}
      hasWhatsapp={Boolean(whatsappPhone)}
      hasDeliveryChoice={deliveryMethods.length > 0}
    />
  )

  // Antes de que CartHydrator siembre el store el carrito está vacío aunque el
  // cliente tenga productos: sin esto el HTML del servidor pintaba "Tu carrito
  // está vacío" y saltaba al formulario. Se muestra el mismo esqueleto que
  // loading.tsx, con los pasos y direcciones reales (las líneas del carrito
  // todavía no se conocen: quedan las 2 por defecto).
  if (!cartHydrated && !success) {
    return (
      <CheckoutSkeleton
        stepCount={steps.length}
        savedAddresses={requiresAddress && initialAddresses.length > 0}
        requiresAddress={requiresAddress}
        assurance={assurance}
      />
    )
  }

  if (cart.length === 0 && !success) return <EmptyCheckout />

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

  const nextStep = steps[current + 1]
  const prevStep = steps[current - 1]
  const ctaLabel = isLastStep ? 'Confirmar pedido' : (nextStep?.continueLabel ?? 'Continuar')
  const totalLabel = dueTotal > 0 ? 'Pagas hoy' : 'Total'

  // CTA — solo el último paso confirma (submit → handleSubmit/zod); los
  // anteriores avanzan con goToStep, que valida antes. Se pinta dos veces: en
  // la columna del resumen (lg) y en la barra fija (móvil); CSS oculta una.
  // Las `key` distintas impiden que React reutilice el mismo <button>: si no,
  // al avanzar al último paso el botón que se acaba de pulsar pasaba a ser
  // type="submit" antes de terminar el clic y enviaba el formulario solo.
  const renderCta = (size: 'md' | 'lg', className: string) =>
    isLastStep ? (
      <Button
        key="confirm"
        type="submit"
        variant="accent"
        size={size}
        full={size === 'lg'}
        loading={loading}
        loadingText="Confirmando pedido…"
        className={className}
      >
        {ctaLabel}
      </Button>
    ) : (
      <Button
        key="continue"
        type="button"
        variant="accent"
        size={size}
        full={size === 'lg'}
        onClick={() => void goToStep(current + 1)}
        className={className}
      >
        {ctaLabel}
      </Button>
    )

  const guestLead = isGuest ? (
    <>
      ¿Ya tienes cuenta?{' '}
      <button
        type="button"
        onClick={() => openAuth('login')}
        className="font-semibold text-accent-ink underline underline-offset-4 cursor-pointer"
      >
        Inicia sesión
      </button>{' '}
      para usar tus datos guardados.
    </>
  ) : undefined

  return (
    <div className={CHECKOUT_PAGE}>
      <h1 className={CHECKOUT_TITLE}>Finalizar compra</h1>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <div className={CHECKOUT_GRID}>
          {/* ── Progreso ─────────────────────────────────── */}
          <div ref={stepsRef} className={`${CHECKOUT_STEPS_CELL} scroll-mt-[calc(var(--nh)+16px)]`}>
            <CheckoutSteps steps={steps} current={current} onSelect={(i) => void goToStep(i)} />
          </div>

          {/* ── Paso actual ──────────────────────────────── */}
          <div ref={contentRef} tabIndex={-1} data-focus-target className={CHECKOUT_CONTENT_CELL}>
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
                      onAddNew={isLoggedIn ? () => setShowNewAddressForm(true) : undefined}
                    />
                    {showNewAddressForm && (
                      <AddressFormPanel
                        title="Agregar y guardar dirección"
                        onSave={saveNewAddress}
                        onCancel={() => setShowNewAddressForm(false)}
                      />
                    )}
                  </>
                )}

                <DeliveryForm
                  register={register}
                  errors={errors}
                  requiresAddress={requiresAddress}
                  lead={guestLead}
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
          </div>

          {/* ── Resumen + CTA (columna fija en lg; repartido en móvil) ── */}
          <div className={CHECKOUT_ASIDE}>
            <OrderSummary
              className={CHECKOUT_SUMMARY_CELL}
              summary={{
                lines: cart,
                subtotal,
                payableNow,
                dueTotal,
                depositPercent: pricingRules.preorderDepositPercent,
                shippingCost,
                shippingFree,
                discount,
                discountName,
                couponCode,
                total,
                shippingThreshold: pricingRules.freeShippingThreshold,
                deliveryLabel: selectedMethod?.name ?? null,
              }}
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

            <div className={CHECKOUT_PANEL}>
              {/* Términos — solo en el último paso, junto al botón que confirma:
                  es lo que se está aceptando al pulsarlo. Se oculta con CSS (no
                  se desmonta) para que el registro del campo y su error sigan
                  vivos entre pasos. */}
              <TermsCheckbox
                hidden={!isLastStep}
                registration={register('acceptTerms')}
                error={errors.acceptTerms?.message}
              />

              {renderCta('lg', 'hidden lg:inline-flex min-h-13')}

              {isFirstStep ? (
                <Link href="/carrito" className={CHECKOUT_BACK_LINK}>
                  <ArrowLeft size={15} aria-hidden />
                  Volver al carrito
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void goToStep(current - 1)}
                  disabled={loading}
                  className={CHECKOUT_BACK_LINK}
                >
                  <ArrowLeft size={15} aria-hidden />
                  {prevStep?.backLabel ?? 'Paso anterior'}
                </button>
              )}
            </div>

            <div className={CHECKOUT_ASSURANCE_CELL}>{assurance}</div>
          </div>
        </div>

        {/* Barra fija en móvil: el total y el CTA siempre a mano. */}
        <div data-sticky-cta className={CHECKOUT_STICKY_BAR}>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] leading-4 text-muted">{totalLabel}</p>
            <p className="font-display font-black text-[22px] leading-none text-accent-ink tabular-nums mt-1">
              {formatCurrency(total)}
            </p>
          </div>
          {renderCta('md', 'min-h-12 px-5')}
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pie del resumen — términos y navegación entre pasos
// ---------------------------------------------------------------------------

function TermsCheckbox({
  hidden,
  registration,
  error,
}: {
  hidden: boolean
  registration: UseFormRegisterReturn
  error?: string
}) {
  return (
    <div
      className={`bg-surf border px-4 py-3 ${error ? 'border-danger' : 'border-(--bd)'} ${hidden ? 'hidden' : ''}`}
    >
      <label className="flex items-start gap-3 cursor-pointer select-none min-h-11 py-1">
        <input
          type="checkbox"
          {...registration}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'checkout-terms-error' : undefined}
          className="mt-0.5 accent-accent-ink size-5 shrink-0"
        />
        <span className="text-[13px] leading-5 text-text">
          Acepto los{' '}
          <Link
            href="/terminos-y-condiciones"
            target="_blank"
            className="text-accent-ink font-semibold underline underline-offset-2"
          >
            términos y condiciones
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </Link>{' '}
          y la{' '}
          <Link
            href="/politica-de-privacidad"
            target="_blank"
            className="text-accent-ink font-semibold underline underline-offset-2"
          >
            política de privacidad
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </Link>
          .
        </span>
      </label>
      {error && (
        <p id="checkout-terms-error" role="alert" className="text-danger text-[13px] mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
