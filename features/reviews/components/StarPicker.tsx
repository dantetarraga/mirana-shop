'use client'

import { starsLabel } from '@/features/reviews/lib/review-summary'
import { cn } from '@/shared/lib/utils'
import { Star } from 'lucide-react'
import { useId } from 'react'

const RATING_WORDS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'] as const

interface StarPickerProps {
  value: number
  onChange: (value: number) => void
  error?: string
  name?: string
}

/**
 * Selector de calificación accesible: un grupo de radios nativos dentro de un
 * fieldset. El navegador ya da Tab para entrar al grupo y flechas para cambiar
 * de valor; cada opción se anuncia como "1 estrella", "2 estrellas"… El dibujo
 * de estrellas es solo la piel de esos radios.
 */
export function StarPicker({ value, onChange, error, name }: StarPickerProps) {
  const autoId = useId()
  const groupName = name ?? `rating-${autoId}`
  const errorId = `${autoId}-error`
  const shown = value

  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <legend className="block text-[10px] tracking-[2px] uppercase text-accent-ink mb-2">
        Tu calificación
      </legend>
      <div className="flex items-center gap-3">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className={cn(
                'relative cursor-pointer p-1 -m-0.5 transition-colors',
                'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-offset-1',
                n <= shown ? 'text-accent-ink' : 'text-muted/60 hover:text-accent-ink',
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              <span className="sr-only">{starsLabel(n)}</span>
              <Star
                aria-hidden
                size={30}
                strokeWidth={1.5}
                fill={n <= shown ? 'currentColor' : 'none'}
              />
            </label>
          ))}
        </div>
        <span aria-hidden className="text-[13px] font-semibold text-text min-w-20">
          {RATING_WORDS[shown] ?? ''}
        </span>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-[12px] text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
