import { cn } from '@/shared/lib/utils'
import { CLAWS, KNUCKLE, LOCKUP, SWOOSH, TALON, TALON_OFFSET, WORDMARK } from './brand-paths'

// ---------------------------------------------------------------------------
// Logo de Mirana en vector puro: las tres garras del logo original con su
// zarpazo, y el logotipo con "MIRA" en acento y "NA" en tinta.
//
// Colores por token para que el mismo SVG sirva en claro y oscuro (sin el
// filtro `invert()` que necesitaba el PNG viejo):
//   - tinta (uñas y "NA"): currentColor
//   - acento (zarpazo y "MIRA"): --brand-moon
//   - nudillos: --brand-slate
// La geometría vive en brand-paths.ts (la reutilizan favicon y estáticos).
// ---------------------------------------------------------------------------

function Claws() {
  return (
    <>
      <path d={SWOOSH} fill="var(--brand-moon)" />
      {CLAWS.map((c) => (
        <g key={c.x} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <path d={KNUCKLE} fill="var(--brand-slate)" />
          <path
            transform={`translate(${TALON_OFFSET.x} ${TALON_OFFSET.y})`}
            d={TALON}
            fill="currentColor"
          />
        </g>
      ))}
    </>
  )
}

interface BrandSvgProps {
  className?: string
  /** Texto accesible. Vacío (`""`) lo vuelve decorativo, p. ej. dentro de un
   *  enlace que ya tiene su propio aria-label. */
  title?: string
}

function a11yProps(title: string | undefined) {
  return title
    ? ({ role: 'img', 'aria-label': title } as const)
    : ({ 'aria-hidden': true } as const)
}

/** Solo el isotipo (las garras). Decorativo salvo que se pase `title`. */
export function MiranaMark({ className, title }: BrandSvgProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('shrink-0', className)}
      focusable="false"
      {...a11yProps(title)}
    >
      <Claws />
    </svg>
  )
}

/** Isotipo + logotipo en horizontal (navbar, footer, modales). */
export function MiranaLogo({ className, title = 'Mirana' }: BrandSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${LOCKUP.width} 100`}
      className={cn('shrink-0', className)}
      focusable="false"
      {...a11yProps(title)}
    >
      <Claws />
      <g
        transform={`translate(${LOCKUP.wordX} ${LOCKUP.wordY}) scale(${LOCKUP.wordScale})`}
        fillRule="evenodd"
      >
        {WORDMARK.map((l) => (
          <path
            key={l.x}
            transform={`translate(${l.x} 0)`}
            d={l.d}
            fill={l.accent ? 'var(--brand-moon)' : 'currentColor'}
          />
        ))}
      </g>
    </svg>
  )
}
