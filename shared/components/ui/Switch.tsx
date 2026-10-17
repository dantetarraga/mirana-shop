'use client'

import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Interruptor on/off (role="switch"). Para cambios que se guardan al instante
// —los switches inline de las tablas del admin—, no para formularios con
// botón "Guardar" (ahí va una casilla).
//
// `label` es obligatorio aunque no se vea: el lector de pantalla anuncia
// "Visible, interruptor, activado". Con `showLabel` se pinta al lado.
// ---------------------------------------------------------------------------

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  showLabel?: boolean
  disabled?: boolean
  /** Guardando: bloquea el clic sin atenuar tanto como `disabled`. */
  busy?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  showLabel = false,
  disabled = false,
  busy = false,
  size = 'sm',
  className,
}: SwitchProps) {
  const sm = size === 'sm'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!busy) onChange(!checked)
      }}
      className={cn(
        'inline-flex items-center gap-2 bg-transparent border-none p-0 text-left cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-40',
        busy && 'cursor-wait',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-150',
          sm ? 'h-5 w-9' : 'h-6 w-11',
          checked ? 'bg-(--gold) border-(--gold)' : 'bg-transparent border-field',
        )}
      >
        <span
          className={cn(
            'absolute rounded-full transition-transform duration-150 motion-reduce:transition-none',
            sm ? 'size-3.5 left-0.5' : 'size-4.5 left-0.5',
            checked
              ? cn('bg-on-accent', sm ? 'translate-x-4' : 'translate-x-5')
              : 'bg-muted translate-x-0',
          )}
        />
      </span>
      {showLabel && <span className="text-[13px] text-text">{label}</span>}
    </button>
  )
}
