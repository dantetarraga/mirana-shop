import { productCartKind } from '@/features/cart/lib/cart-kind'
import { formatEstimatedArrival } from '@/features/cart/lib/estimated-arrival'
import { eligibleDeliveryMethods } from '@/features/checkout/lib/delivery-eligibility'
import { canPartialPreorder, resolveDepositPercent } from '@/features/checkout/lib/preorder'
import type { PricingRules } from '@/features/checkout/lib/pricing'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { cn, formatCurrency } from '@/shared/lib/utils'
import { ChevronDown, CreditCard, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Acordeones de la ficha: pago, envío y autenticidad.
//
// Todo el contenido sale de cómo funciona de verdad la tienda (mismo flujo que
// PaymentSection y SuccessScreen del checkout, mismas formas de entrega que el
// checkout le ofrecería a ESTE producto, misma frase del footer). Nada de
// garantías o certificados que la tienda no ofrece.
//
// <details>/<summary> nativo: teclado, lector de pantalla y estado abierto sin
// JS. `name` los agrupa (abrir uno cierra el otro). La altura se anima con
// `::details-content` + `interpolate-size` donde el navegador lo soporta; en el
// resto abre en seco, y con prefers-reduced-motion nunca se anima.
// ---------------------------------------------------------------------------

const GROUP_NAME = 'pdp-info'

interface ProductInfoAccordionsProps {
  product: Pick<
    CatalogProduct,
    'status' | 'estimatedArrival' | 'allowPartialPreorder' | 'preorderDepositPercent'
  >
  pricingRules: PricingRules
  /** Nombres de las cuentas de pago activas (sin números). */
  paymentMethodNames: string[]
}

function Accordion({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <details
      name={GROUP_NAME}
      className={cn(
        'group border-b border-(--bd) [interpolate-size:allow-keywords]',
        'details-content:h-0 details-content:overflow-clip open:details-content:h-auto',
        'details-content:transition-[height,content-visibility] details-content:transition-discrete details-content:duration-250 details-content:ease-out',
        'motion-reduce:details-content:transition-none',
      )}
    >
      <summary
        className={cn(
          'flex items-center gap-3 min-h-14 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden',
          'text-[15px] font-semibold text-text hover:text-accent-ink transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        )}
      >
        <Icon size={18} className="shrink-0 text-accent-ink" aria-hidden />
        <span className="flex-1">{title}</span>
        <ChevronDown
          size={18}
          aria-hidden
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="pb-5 pl-7.5 pr-1 text-[14px] leading-relaxed text-muted flex flex-col gap-3 max-w-[68ch]">
        {children}
      </div>
    </details>
  )
}

export function ProductInfoAccordions({
  product,
  pricingRules,
  paymentMethodNames,
}: ProductInfoAccordionsProps) {
  const isPreorder = product.status === 'PREORDER'
  // Las mismas formas de entrega que el checkout le ofrecería a este producto
  // (la preventa no se despacha a domicilio: features/checkout/lib/delivery-eligibility.ts).
  const deliveryMethods = eligibleDeliveryMethods(
    pricingRules.deliveryMethods,
    productCartKind(product),
  )
  const depositPercent = canPartialPreorder(product)
    ? resolveDepositPercent(product, pricingRules.preorderDepositPercent)
    : null

  return (
    <div className="border-t border-(--bd)">
      <Accordion icon={CreditCard} title="Métodos de pago">
        <p>
          Pagas por transferencia o depósito. Al confirmar tu pedido no se cobra nada: te damos un
          código y luego realizas el pago.
        </p>
        <ol className="list-decimal pl-5 flex flex-col gap-1 marker:text-muted">
          <li>Confirma tu pedido y anota el código.</li>
          <li>Transfiere o deposita el total a una de nuestras cuentas.</li>
          <li>Envía el comprobante por WhatsApp. Con eso confirmamos tu pedido.</li>
        </ol>
        {paymentMethodNames.length > 0 && (
          <div>
            <p className="text-text font-semibold mb-2">Puedes pagar con</p>
            <ul className="flex flex-wrap gap-2" aria-label="Cuentas disponibles">
              {paymentMethodNames.map((name) => (
                <li
                  key={name}
                  className="border border-(--bd) px-2.5 py-1 text-[13px] font-semibold text-text"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
        {depositPercent != null && (
          <p>
            Esta preventa se puede reservar con un adelanto del {depositPercent}%. El saldo se paga
            cuando el producto esté listo para entregarse.
          </p>
        )}
      </Accordion>

      <Accordion icon={Truck} title="Opciones de envío">
        {isPreorder && (
          <p>
            <span className="text-text font-semibold">Producto en preventa.</span> Tu pedido se
            entrega cuando llegue la mercadería. Llegada estimada:{' '}
            <span className="text-text font-semibold">
              {formatEstimatedArrival(product.estimatedArrival)}
            </span>
            . La fecha es estimada y puede cambiar.
          </p>
        )}
        {deliveryMethods.length > 0 ? (
          <ul className="flex flex-col divide-y divide-(--bd) border-y border-(--bd)">
            {deliveryMethods.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-text font-semibold">{m.name}</div>
                  {m.description && <div className="text-[13px]">{m.description}</div>}
                </div>
                <div
                  className={cn(
                    'shrink-0 font-semibold',
                    m.cost === 0 ? 'text-success' : 'text-text',
                  )}
                >
                  {m.cost === 0 ? 'Gratis' : formatCurrency(m.cost)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Eliges la forma de entrega al confirmar tu pedido.</p>
        )}
        {pricingRules.freeShippingThreshold != null && (
          <p>Envío gratis en pedidos desde {formatCurrency(pricingRules.freeShippingThreshold)}.</p>
        )}
      </Accordion>

      <Accordion icon={ShieldCheck} title="Autenticidad garantizada">
        <p>
          Todos nuestros productos son 100% originales y de importación directa.
        </p>
      </Accordion>
    </div>
  )
}
