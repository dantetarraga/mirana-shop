import { cn } from '@/shared/lib/utils'
import type { ButtonHTMLAttributes, Ref } from 'react'

export type ButtonVariant =
  | 'accent'
  | 'outline'
  | 'ghost'
  | 'dark'
  | 'tab'
  | 'icon'
  /** Confirmación momentánea tras una acción (ej. "Agregado al carrito") */
  | 'success'
  /** CTA de WhatsApp (verde de marca con texto oscuro accesible) */
  | 'whatsapp'
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

export interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  active?: boolean
  full?: boolean
  clip?: boolean
  destructive?: boolean
  className?: string
}

/**
 * Clases de botón para OTROS elementos — sobre todo `<Link>`.
 * `<Link><Button/></Link>` anida un <button> dentro de un <a> (HTML inválido:
 * dos elementos interactivos, dos paradas de Tab). Se estiliza el enlace:
 *   <Link href="/catalogo" className={buttonClass({ variant: 'outline' })}>
 */
export function buttonClass({
  variant = 'accent',
  size = 'md',
  active = false,
  full = false,
  clip = false,
  destructive = false,
  className,
}: ButtonClassOptions = {}) {
  return cn(
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    active && 'ui-btn--active',
    full && 'ui-btn--full',
    clip && 'ui-btn--clip',
    destructive && 'ui-btn--destructive',
    // Tailwind utilities (@layer utilities) tienen mayor especificidad
    // que @layer components — garantiza que el icono siempre sea visible
    variant === 'icon' && !destructive && 'text-muted hover:text-text',
    variant === 'icon' && destructive && 'text-muted',
    className,
  )
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
      className={buttonClass({ variant, size, active, full, clip, destructive, className })}
      {...props}
    >
      {children}
    </button>
  )
}
