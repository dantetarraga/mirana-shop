'use client'

import { cn } from '@/shared/lib/utils'
import { Check } from 'lucide-react'
import type React from 'react'

// ---------------------------------------------------------------------------
// Barra de pasos del checkout. Reemplaza el formulario largo de una sola
// columna: el cliente ve una pantalla por vez y no tiene que hacer scroll para
// llegar al botón de confirmar. Los pasos ya recorridos son clicables para
// volver a corregir algo; avanzar lo controla el padre, que valida antes.
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
  return (
    <nav aria-label="Pasos para completar tu compra">
      <ol className="flex items-stretch border border-(--bd) bg-card divide-x divide-(--bd)">
        {steps.map((step, i) => {
          const isCurrent = i === current
          const isDone = i < current
          const Icon = step.icon

          return (
            <li key={step.id} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'w-full h-full flex items-center gap-2.5 px-3 sm:px-4 py-3 text-left transition-colors duration-150 cursor-pointer',
                  isCurrent ? 'bg-(--sub)' : 'hover:bg-(--sub)/50',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 shrink-0 flex items-center justify-center font-display font-black text-[11px] border',
                    isCurrent
                      ? 'bg-(--gold) text-black border-(--gold)'
                      : isDone
                        ? 'border-(--gold) text-accent-ink'
                        : 'border-(--bd) text-muted',
                  )}
                >
                  {isDone ? <Check size={12} aria-hidden /> : i + 1}
                </span>

                <span className="min-w-0 flex items-center gap-1.5">
                  <Icon
                    size={14}
                    className={cn(
                      'shrink-0 hidden sm:block',
                      isCurrent ? 'text-accent-ink' : 'text-muted',
                    )}
                  />
                  <span
                    className={cn(
                      'font-display font-bold text-[11px] sm:text-[12px] uppercase tracking-tight truncate',
                      isCurrent ? 'text-text' : 'text-muted',
                    )}
                  >
                    <span className="sr-only">Paso {i + 1}: </span>
                    {step.label}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
