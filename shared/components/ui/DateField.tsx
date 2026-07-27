'use client'

import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { Calendar, X } from 'lucide-react'
import { useRef, type ComponentPropsWithoutRef } from 'react'

type DateFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  /** Muestra un botón para vaciar la fecha (solo si hay valor y no es de solo lectura). */
  clearable?: boolean
  onClear?: () => void
}

/**
 * Campo de fecha con la paleta del sitio.
 *
 * `<input type="date">` no es estilizable por dentro: el icono de calendario lo
 * pinta el navegador con su propio color y desentona con el tema. Aquí se
 * esconde ese indicador (estirado sobre todo el campo, así un click en
 * cualquier parte abre el calendario) y se dibuja el icono con el acento.
 *
 * El panel del calendario en sí lo sigue renderizando el navegador, pero
 * `color-scheme` (globals.css) ya lo hace seguir el tema claro/oscuro, así que
 * no hace falta arrastrar una librería de date picker solo por el color.
 */
export function DateField({ className, clearable, onClear, ...props }: DateFieldProps) {
  const ref = useRef<HTMLInputElement>(null)
  const hasValue = Boolean(props.value ?? props.defaultValue)

  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        type="date"
        className={cn(cls.input, 'ui-date pr-10', className)}
      />

      {clearable && hasValue && !props.disabled ? (
        <button
          type="button"
          aria-label="Quitar fecha"
          onClick={onClear}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 z-1 p-1 text-muted hover:text-danger transition-colors duration-150"
        >
          <X size={14} />
        </button>
      ) : (
        <Calendar
          size={15}
          aria-hidden
          className="absolute top-1/2 right-3 -translate-y-1/2 text-accent-ink pointer-events-none"
        />
      )}
    </div>
  )
}
