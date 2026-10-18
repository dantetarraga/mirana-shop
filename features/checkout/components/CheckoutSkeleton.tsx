import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'
import {
  CHECKOUT_ASIDE,
  CHECKOUT_ASSURANCE_CELL,
  CHECKOUT_CONTENT_CELL,
  CHECKOUT_GRID,
  CHECKOUT_PAGE,
  CHECKOUT_PANEL,
  CHECKOUT_STEPS_CELL,
  CHECKOUT_STICKY_BAR,
  CHECKOUT_SUMMARY_CELL,
  CHECKOUT_TITLE,
  fieldGrid,
  DELIVERY_FIELD_HINTS,
  sectionCard,
} from './checkout-layout'

// ---------------------------------------------------------------------------
// Esqueleto del checkout — calca CheckoutView en su primer paso ("Tus datos"):
// mismas clases de rejilla y columnas (checkout-layout.ts), fila de pasos h-11,
// campos h-12 con sus hints, resumen (acordeón h-14 en móvil, tarjeta completa
// en lg) y barra fija inferior en móvil. Lo usan loading.tsx (sin datos) y
// CheckoutView mientras el carrito se hidrata (con los conteos reales).
// ---------------------------------------------------------------------------

type Props = {
  /** Pasos del checkout: 3 con formas de entrega configuradas, 2 sin ellas */
  stepCount?: number
  /** Líneas del resumen */
  lineCount?: number
  /** Se pinta el bloque de direcciones guardadas (cliente con sesión) */
  savedAddresses?: boolean
  /** El formulario pide dirección (si no, solo contacto) */
  requiresAddress?: boolean
  /** Bloque "Cómo funciona tu compra" ya renderizado (texto estático real) */
  assurance: ReactNode
}

/** Bloque label (h-5 + mb-1.5) + control h-12 (+ hint 22px) */
function FieldSkeleton({ span, hint, w = 'w-24' }: { span?: boolean; hint?: string; w?: string }) {
  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <div className="h-5 mb-1.5 flex items-center">
        <Skeleton className={cn('h-3', w)} />
      </div>
      <Skeleton className="h-12 w-full" />
      {hint && (
        <div className="h-4 mt-1.5 flex items-center">
          <Skeleton className="h-2.5 w-32" />
        </div>
      )}
    </div>
  )
}

/** Título de sección: 22px leading-none */
function TitleSkeleton({ w }: { w: string }) {
  return <Skeleton className={cn('h-5.5', w)} />
}

export function CheckoutSkeleton({
  stepCount = 3,
  lineCount = 2,
  savedAddresses = false,
  requiresAddress = true,
  assurance,
}: Props) {
  return (
    <SkeletonRegion label="Cargando checkout…" className={CHECKOUT_PAGE}>
      {/* h1 — mismo bloque tipográfico, leading-none = 1em */}
      <div className={CHECKOUT_TITLE}>
        <Skeleton className="h-[1em] w-[7.5em]" />
      </div>

      <div className={CHECKOUT_GRID}>
        {/* Pasos */}
        <div className={CHECKOUT_STEPS_CELL}>
          <div className="flex items-center gap-2 sm:gap-3 h-11">
            {Array.from({ length: stepCount }, (_, i) => {
              const isLast = i === stepCount - 1
              return (
                <div
                  key={i}
                  className={cn('flex items-center gap-2 sm:gap-3 min-w-0', !isLast && 'flex-1')}
                >
                  <div className="flex items-center gap-2 h-11">
                    <Skeleton className="size-7 shrink-0" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  {!isLast && <Skeleton className="h-0.5 flex-1 min-w-3" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Paso "Tus datos" */}
        <div className={CHECKOUT_CONTENT_CELL}>
          {savedAddresses && (
            <div className={sectionCard}>
              <div className="flex items-center justify-between gap-3 mb-5">
                <TitleSkeleton w="w-52" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 2 }, (_, i) => (
                  <Skeleton key={i} className="h-19 w-full" />
                ))}
              </div>
            </div>
          )}

          <div className={sectionCard}>
            <TitleSkeleton w="w-28" />
            {/* Bajada: 2 líneas en móvil, 1 desde sm (min-h del real) */}
            <div className="mt-2 min-h-10 sm:min-h-5 flex flex-col justify-center gap-2 sm:block">
              <Skeleton className="h-3 w-full sm:w-96 sm:mt-1" />
              <Skeleton className="h-3 w-2/3 sm:hidden" />
            </div>

            <div className={fieldGrid}>
              <FieldSkeleton span w="w-32" />
              <FieldSkeleton hint={DELIVERY_FIELD_HINTS.dni} w="w-10" />
              <FieldSkeleton hint={DELIVERY_FIELD_HINTS.phone} w="w-16" />
              <FieldSkeleton span w="w-32" />
              {requiresAddress && (
                <>
                  <FieldSkeleton span w="w-20" />
                  <FieldSkeleton w="w-16" />
                  <FieldSkeleton w="w-14" />
                  <FieldSkeleton span hint={DELIVERY_FIELD_HINTS.reference} w="w-20" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Columna del resumen */}
        <div className={CHECKOUT_ASIDE}>
          <div className={cn('bg-card border border-(--bd)', CHECKOUT_SUMMARY_CELL)}>
            {/* Móvil: acordeón cerrado h-14 */}
            <div className="lg:hidden h-14 px-4 flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-5.5 w-24" />
              <Skeleton className="size-4.5" />
            </div>

            {/* lg: tarjeta abierta */}
            <div className="max-lg:hidden p-6">
              <div className="flex items-center justify-between gap-3 mb-5 h-5.5">
                <TitleSkeleton w="w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex flex-col gap-4">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Skeleton className="size-16 shrink-0" />
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <Skeleton className="h-3.5 w-11/12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3.5 w-16 mt-1" />
                  </div>
                ))}
              </div>

              {/* Cupón */}
              <div className="border-t border-(--bd) pt-5 mt-5">
                <div className="h-5 mb-1.5 flex items-center">
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                </div>
              </div>

              {/* Totales: subtotal, envío y total */}
              <div className="border-t border-(--bd) pt-5 mt-5 flex flex-col gap-2.5">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center h-5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
                <div className="flex justify-between items-end border-t border-(--bd) pt-4 mt-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-7.5 w-32" />
                </div>
              </div>
            </div>
          </div>

          {/* Pie: CTA (lg) + volver */}
          <div className={CHECKOUT_PANEL}>
            <div className="hidden lg:flex ui-btn ui-btn--lg ui-btn--full skeleton min-h-13">&nbsp;</div>
            <div className="self-center min-h-11 flex items-center">
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>

          <div className={CHECKOUT_ASSURANCE_CELL}>{assurance}</div>
        </div>
      </div>

      {/* Barra fija en móvil */}
      <div data-sticky-cta aria-hidden className={CHECKOUT_STICKY_BAR}>
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5.5 w-28" />
        </div>
        <div className="ui-btn ui-btn--md skeleton min-h-12 w-42">&nbsp;</div>
      </div>
    </SkeletonRegion>
  )
}
