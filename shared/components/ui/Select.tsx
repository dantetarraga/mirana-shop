'use client'

import { cn } from '@/shared/lib/utils'
import { ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'

// ---------------------------------------------------------------------------
// Select — select nativo con el estilo del design system (adm-input) y
// chevron propio. Compatible con react-hook-form vía register(...).
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
        className={cn('adm-input appearance-none pr-9 w-full cursor-pointer', className)}
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
