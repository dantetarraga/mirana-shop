'use client'

import { cn } from '@/shared/lib/utils'
import { Check } from 'lucide-react'
import type React from 'react'

// ---------------------------------------------------------------------------
// Progreso del checkout. Es una secuencia real (datos → entrega → pago), así
// que los pasos van numerados y unidos por un tramo que se llena al completar.
// Solo los pasos ya recorridos son botones —para volver a corregir algo—;
// avanzar se hace con el CTA del resumen, que valida antes (CheckoutView).
//
// Alto fijo h-11: el esqueleto (CheckoutSkeleton) dibuja la misma fila.
// ---------------------------------------------------------------------------

export type CheckoutStepInfo = {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

type Props = {
  steps: CheckoutStepInfo[]
  /** Índice del paso visible */
  current: number
  onSelect: (index: number) => void
}

export function CheckoutSteps({ steps, current, onSelect }: Props) {
  const total = steps.length

  return (
    <nav aria-label="Progreso de tu compra">
      <ol className="flex items-center gap-2 sm:gap-3 h-11">
        {steps.map((step, i) => {
          const isCurrent = i === current
          const isDone = i < current
          const isLast = i === total - 1

          const marker = (
            <span
              aria-hidden
              className={cn(
                'size-7 shrink-0 flex items-center justify-center font-display font-black text-[15px] leading-none transition-colors duration-200',
                isDone && 'bg-(--gold) text-on-accent',
                isCurrent && 'border-2 border-(--gold) text-text',
                !isDone && !isCurrent && 'border border-field text-muted',
              )}
            >
              {isDone ? <Check size={15} strokeWidth={3} /> : i + 1}
            </span>
          )

          const label = (
            <span
              className={cn(
                'text-[14px] leading-5 whitespace-nowrap',
                isCurrent ? 'font-semibold text-text' : isDone ? 'font-medium text-text' : 'text-muted',
              )}
            >
              {step.label}
            </span>
          )

          const status = isDone ? 'completado' : isCurrent ? 'paso actual' : 'pendiente'

          return (
            <li
              key={step.id}
              className={cn('flex items-center gap-2 sm:gap-3 min-w-0', !isLast && 'flex-1')}
            >
              {isDone ? (
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="group flex items-center gap-2 h-11 -mx-1 px-1 cursor-pointer"
                >
                  {marker}
                  <span className="group-hover:underline underline-offset-4">{label}</span>
                  <span className="sr-only">
                    , paso {i + 1} de {total}, {status}. Volver a este paso
                  </span>
                </button>
              ) : (
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className="flex items-center gap-2 h-11"
                >
                  {marker}
                  {label}
                  <span className="sr-only">
                    , paso {i + 1} de {total}, {status}
                  </span>
                </span>
              )}

              {/* Tramo hacia el siguiente paso: lleno cuando este ya se completó */}
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    'h-0.5 flex-1 min-w-3 transition-colors duration-300',
                    isDone ? 'bg-(--gold)' : 'bg-(--bd)',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
