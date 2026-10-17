import { Spinner } from '@/shared/components/ui/Spinner'
import { cn } from '@/shared/lib/utils'
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

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
  /**
   * Acción en curso (server action, envío de formulario). Deshabilita el botón,
   * marca `aria-busy` y superpone un spinner SIN cambiar el ancho: la etiqueta
   * sigue ocupando su lugar, invisible. No cambiar el texto a "Guardando..."
   * — eso hace saltar el layout; usar `loadingText` para el lector de pantalla.
   */
  loading?: boolean
  /** Lo que anuncia el lector de pantalla mientras `loading` (def. la etiqueta). */
  loadingText?: string
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
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={buttonClass({
        variant,
        size,
        active,
        full,
        clip,
        destructive,
        className: cn(loading && 'relative', className),
      })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoadingContent label={loadingText}>{children}</LoadingContent> : children}
    </button>
  )
}

/**
 * Mientras carga: la etiqueta queda en el flujo con `visibility: hidden`
 * (`display: contents` conserva el `gap` del botón entre icono y texto), así el
 * ancho no cambia; el spinner va centrado encima. Como lo invisible sale del
 * árbol de accesibilidad, el nombre del botón se repite en un sr-only.
 */
function LoadingContent({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <>
      <span className="contents invisible">{children}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <Spinner size={16} />
      </span>
      <span className="sr-only">{label ?? (typeof children === 'string' ? children : 'Procesando…')}</span>
    </>
  )
}
