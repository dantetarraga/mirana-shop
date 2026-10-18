import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Logo de Mirana en vector puro.
//
// Isotipo: luna creciente cruzada por una flecha (la idea del logo anterior,
// simplificada para que se lea a 32px). Logotipo: letras propias condensadas
// —en la familia de Barlow Condensed— con las dos A como puntas de flecha (Λ),
// que retoman la flecha del isotipo.
//
// La tinta usa `currentColor` y la luna `--brand-moon`, así el mismo SVG sirve
// en tema claro y oscuro sin el filtro `invert()` que necesitaba el PNG viejo.
// Los paths son la fuente única: public/logo*.svg y app/icon.tsx los reutilizan
// desde `brand-paths.ts`.
// ---------------------------------------------------------------------------

import { ARROW_HEAD, ARROW_SHAFT, CRESCENT, WORDMARK } from './brand-paths'

interface MarkProps {
  className?: string
  /** Texto accesible. Sin él, el SVG es decorativo (aria-hidden). */
  title?: string
}

export function MiranaMark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={CRESCENT} fill="var(--brand-moon)" />
      <path d={ARROW_SHAFT} stroke="currentColor" strokeWidth={7} fill="none" />
      <path d={ARROW_HEAD} fill="currentColor" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  /** Texto accesible; por defecto "Mirana". `""` lo vuelve decorativo (p. ej.
   *  dentro de un enlace que ya tiene su propio aria-label). */
  title?: string
}

/** Isotipo + logotipo en horizontal (navbar, footer, modales). */
export function MiranaLogo({ className, title = 'Mirana' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 420 100"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={CRESCENT} fill="var(--brand-moon)" />
      <path d={ARROW_SHAFT} stroke="currentColor" strokeWidth={7} fill="none" />
      <path d={ARROW_HEAD} fill="currentColor" />
      <g transform="translate(116 22) scale(0.5625)" fill="currentColor" fillRule="evenodd">
        {WORDMARK.map((letter) => (
          <path key={letter.x} transform={`translate(${letter.x} 0)`} d={letter.d} />
        ))}
      </g>
    </svg>
  )
}
