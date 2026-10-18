// Geometría del logo de Mirana (viewBox del isotipo: 0 0 100 100).
// Sin dependencias de React: la usan el componente, el favicon (next/og) y
// scripts/build-logo.ts, que genera los SVG estáticos de public/.

/**
 * Luna creciente: círculo (50,50) r46 menos círculo (74,44) r40, resuelto como
 * un único path (sin <mask>) porque next/og no soporta máscaras.
 */
export const CRESCENT = 'M81.81 16.77 A46 46 0 1 0 62.43 94.29 A40 40 0 0 1 81.81 16.77 Z'

/** Flecha que cruza la luna en diagonal y escapa por arriba a la derecha. */
export const ARROW_SHAFT = 'M14 86 L78 22'
export const ARROW_HEAD = 'M68 16 L94 6 L84 32 Z'

/**
 * Letras de "MIRANA" a 100 de alto (se escalan a 0.5625 junto al isotipo).
 * `x` es el desplazamiento de cada letra; las A son puntas de flecha (Λ).
 */
export const WORDMARK: ReadonlyArray<{ x: number; d: string }> = [
  { x: 0, d: 'M0,100 L0,0 L18,0 L38,48 L58,0 L76,0 L76,100 L58,100 L58,40 L44,74 L32,74 L18,40 L18,100 Z' },
  { x: 90, d: 'M0,0 H18 V100 H0 Z' },
  {
    x: 122,
    d: 'M0,0 H34 C50,0 60,12 60,27 C60,40 52,50 40,53 L60,100 H40 L22,56 H18 V100 H0 Z M18,17 V39 H33 C40,39 43,34 43,28 C43,22 40,17 33,17 Z',
  },
  { x: 194, d: 'M0,100 L24,0 H42 L66,100 H48 L33,36 L18,100 Z' },
  { x: 274, d: 'M0,100 V0 H18 L44,62 V0 H62 V100 H44 L18,38 V100 Z' },
  { x: 350, d: 'M0,100 L24,0 H42 L66,100 H48 L33,36 L18,100 Z' },
]

/** Colores fijos para los SVG estáticos (correos, JSON-LD, OG). */
export const BRAND_COLORS = {
  navy: '#0b1830',
  moonOnLight: '#00a6dd',
  moonOnDark: '#00c8ff',
  white: '#ffffff',
} as const

/** SVG completo (isotipo + logotipo) como string, para archivos estáticos. */
export function logoSvg({ ink, moon }: { ink: string; moon: string }): string {
  const letters = WORDMARK.map(
    (l) => `<path transform="translate(${l.x} 0)" d="${l.d}"/>`,
  ).join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" width="420" height="100" role="img" aria-label="Mirana">` +
    `<path d="${CRESCENT}" fill="${moon}"/>` +
    `<path d="${ARROW_SHAFT}" stroke="${ink}" stroke-width="7" fill="none"/>` +
    `<path d="${ARROW_HEAD}" fill="${ink}"/>` +
    `<g transform="translate(116 22) scale(0.5625)" fill="${ink}" fill-rule="evenodd">${letters}</g>` +
    `</svg>`
  )
}

/** Solo el isotipo, para favicon y avatar. */
export function markSvg({ ink, moon, bg }: { ink: string; moon: string; bg?: string }): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    (bg ? `<rect width="100" height="100" fill="${bg}"/>` : '') +
    `<path d="${CRESCENT}" fill="${moon}"/>` +
    `<path d="${ARROW_SHAFT}" stroke="${ink}" stroke-width="7" fill="none"/>` +
    `<path d="${ARROW_HEAD}" fill="${ink}"/>` +
    `</svg>`
  )
}

/** Data URI de un SVG, para <img> dentro de next/og (favicon, OG). */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
