'use client'

import { inputCls } from '@/shared/lib/ui-classes'
import { cn } from '@/shared/lib/utils'
import { ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'

// ---------------------------------------------------------------------------
// Select — select nativo con el mismo estilo de campo que los inputs (inputCls)
// y chevron propio. Compatible con react-hook-form vía register(...).
//
// El desplegable lo sigue pintando el navegador, pero `color-scheme` (globals)
// hace que respete el tema claro/oscuro.
// ---------------------------------------------------------------------------

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** Clases extra para el <select>; el wrapper siempre es relative */
  className?: string
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        {...props}
        className={cn(inputCls, 'appearance-none pr-9 cursor-pointer', className)}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
      />
    </div>
  )
})
