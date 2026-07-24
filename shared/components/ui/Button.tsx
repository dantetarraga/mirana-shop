import { cn } from '@/shared/lib/utils'
import { type ButtonHTMLAttributes, type Ref } from 'react'

export type ButtonVariant = 'accent' | 'outline' | 'ghost' | 'dark' | 'tab' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  active?: boolean
  full?: boolean
  clip?: boolean
  destructive?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'accent',
  size = 'md',
  active = false,
  full = false,
  clip = false,
  destructive = false,
  className,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        active && 'ui-btn--active',
        full && 'ui-btn--full',
        clip && 'ui-btn--clip',
        destructive && 'ui-btn--destructive',
        // Tailwind utilities (@layer utilities) tienen mayor especificidad
        // que @layer components — garantiza que el icono siempre sea visible
        variant === 'icon' && !destructive && 'text-white/70 hover:text-white',
        variant === 'icon' && destructive && 'text-white/70',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
