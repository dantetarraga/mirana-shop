'use client'

import { cn } from '@/shared/lib/utils'
import { Info } from 'lucide-react'
import { useId } from 'react'

interface InfoTooltipProps {
  /** Qué explica el tooltip — es el nombre accesible del disparador. */
  label: string
  children: React.ReactNode
  /** Borde del disparador al que se alinea el panel. */
  align?: 'left' | 'right'
  className?: string
}

/**
 * Icono de ayuda con globo al pasar el mouse. Sin librería: `group-hover` para
 * el mouse y `group-focus-within` para teclado y touch (donde no hay hover, el
 * tap enfoca el botón y abre el globo igual).
 *
 * El panel es `w-64` y se alinea a un borde a propósito: dentro de un
 * AdminDrawer (`overflow-y-auto`, 440 px) uno centrado se recortaría.
 */
export function InfoTooltip({ label, children, align = 'left', className }: InfoTooltipProps) {
  const id = useId()

  return (
    <span className={cn('group relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="text-muted hover:text-text focus-visible:text-text transition-colors cursor-help"
      >
        <Info size={13} aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute top-full mt-2 z-30 w-64 p-3',
          'bg-card border border-(--bd) shadow-lg',
          // El disparador suele vivir en una etiqueta uppercase con tracking
          // (cls.label); el contenido del globo se lee como texto normal.
          'text-left text-[12px] leading-relaxed normal-case tracking-normal text-text font-sans font-normal',
          'invisible opacity-0 transition-opacity duration-150',
          'group-hover:visible group-hover:opacity-100',
          'group-focus-within:visible group-focus-within:opacity-100',
          align === 'right' ? 'right-0' : 'left-0',
        )}
      >
        {children}
      </span>
    </span>
  )
}
