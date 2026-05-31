import { cn } from '@/shared/lib/utils'
import { type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'accent' | 'outline' | 'ghost' | 'dark' | 'tab' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  active?: boolean
  full?: boolean
  clip?: boolean
  destructive?: boolean
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
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        active && 'ui-btn--active',
        full && 'ui-btn--full',
        clip && 'ui-btn--clip',
        destructive && 'ui-btn--destructive',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
