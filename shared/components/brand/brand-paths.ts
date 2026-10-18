// Geometría del logo de Mirana (viewBox del isotipo: 0 0 100 100).
// Sin dependencias de React: la usan el componente, el favicon (next/og) y
// scripts/build-logo.ts, que genera los SVG estáticos de public/.
//
// Redibujo vectorial del logo original (public/brand/logo-legacy.svg): las
// tres garras con sus nudillos y el trazo envolvente, simplificados para que
// se lean a 32px. El logotipo conserva las A sin travesaño y el "MIRA" en
// cyan del original; "NA" pasa a la tinta del tema (antes era blanco fijo y
// desaparecía sobre fondo claro).

/** Uña: base arriba, curva hacia abajo-izquierda hasta la punta. */
export const TALON = 'M18 0 C27 12 24 34 0 50 C9 36 10 20 5 6 Z'
/** Nudillo: capucha que envuelve la base de la uña. */
export const KNUCKLE = 'M1 16 C0 2 26 -3 32 10 L25 15 C21 7 10 7 8 16 Z'
/** Desplazamiento de la uña respecto de su nudillo. */
export const TALON_OFFSET = { x: 4, y: 7 } as const
/** Las tres garras, de menor a mayor (como en el logo original). */
export const CLAWS: ReadonlyArray<{ x: number; y: number; s: number }> = [
  { x: 6, y: 12, s: 0.88 },
  { x: 29, y: 4, s: 1.02 },
  { x: 55, y: 6, s: 1.16 },
]
/** Trazo envolvente bajo las garras (el "zarpazo"). */
export const SWOOSH = 'M2 86 C30 70 70 64 100 52 C76 72 36 82 2 86 Z'

/**
 * Letras de "MIRANA" a 100 de alto (se escalan a 0.5625 junto al isotipo).
 * `x` es el desplazamiento de cada letra; las cuatro primeras ("MIRA") van en
 * el color de acento, las dos últimas ("NA") en la tinta.
 */
export const WORDMARK: ReadonlyArray<{ x: number; d: string; accent: boolean }> = [
  {
    x: 0,
    accent: true,
    d: 'M0,100 L0,0 L18,0 L38,48 L58,0 L76,0 L76,100 L58,100 L58,40 L44,74 L32,74 L18,40 L18,100 Z',
  },
  { x: 90, accent: true, d: 'M0,0 H18 V100 H0 Z' },
  {
    x: 122,
    accent: true,
    d: 'M0,0 H34 C50,0 60,12 60,27 C60,40 52,50 40,53 L60,100 H40 L22,56 H18 V100 H0 Z M18,17 V39 H33 C40,39 43,34 43,28 C43,22 40,17 33,17 Z',
  },
  { x: 194, accent: true, d: 'M0,100 L24,0 H42 L66,100 H48 L33,36 L18,100 Z' },
  { x: 274, accent: false, d: 'M0,100 V0 H18 L44,62 V0 H62 V100 H44 L18,38 V100 Z' },
  { x: 350, accent: false, d: 'M0,100 L24,0 H42 L66,100 H48 L33,36 L18,100 Z' },
]

/** El logotipo termina en x=352: el viewBox deja un margen similar a ambos
 * lados para centrar la marca sin espacio vacío a la derecha. */
export const LOCKUP = { width: 354, wordX: 118, wordY: 22, wordScale: 0.5625 } as const

/** Colores fijos para los SVG estáticos (correos, JSON-LD, OG, favicon). */
export const BRAND_COLORS = {
  navy: '#0b1830',
  white: '#ffffff',
  accentOnLight: '#00a6dd',
  accentOnDark: '#00c8ff',
  slateOnLight: '#7d93aa',
  slateOnDark: '#5d7389',
} as const

interface Palette {
  ink: string
  accent: string
  slate: string
}

function clawsSvg({ ink, accent, slate }: Palette): string {
  const claws = CLAWS.map(
    (c) =>
      `<g transform="translate(${c.x} ${c.y}) scale(${c.s})">` +
      `<path d="${KNUCKLE}" fill="${slate}"/>` +
      `<path transform="translate(${TALON_OFFSET.x} ${TALON_OFFSET.y})" d="${TALON}" fill="${ink}"/>` +
      `</g>`,
  ).join('')
  return `<path d="${SWOOSH}" fill="${accent}"/>${claws}`
}

/** SVG completo (isotipo + logotipo) como string, para archivos estáticos. */
export function logoSvg(palette: Palette): string {
  const letters = WORDMARK.map(
    (l) =>
      `<path transform="translate(${l.x} 0)" d="${l.d}" fill="${l.accent ? palette.accent : palette.ink}"/>`,
  ).join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOCKUP.width} 100" width="${LOCKUP.width}" height="100" role="img" aria-label="Mirana">` +
    clawsSvg(palette) +
    `<g transform="translate(${LOCKUP.wordX} ${LOCKUP.wordY}) scale(${LOCKUP.wordScale})" fill-rule="evenodd">${letters}</g>` +
    `</svg>`
  )
}

/** Solo el isotipo, para favicon y avatar. */
export function markSvg(palette: Palette & { bg?: string }): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    (palette.bg ? `<rect width="100" height="100" fill="${palette.bg}"/>` : '') +
    clawsSvg(palette) +
    `</svg>`
  )
}

/** Paletas listas para fondo claro y oscuro. */
export const PALETTE_ON_LIGHT: Palette = {
  ink: BRAND_COLORS.navy,
  accent: BRAND_COLORS.accentOnLight,
  slate: BRAND_COLORS.slateOnLight,
}
export const PALETTE_ON_DARK: Palette = {
  ink: BRAND_COLORS.white,
  accent: BRAND_COLORS.accentOnDark,
  slate: BRAND_COLORS.slateOnDark,
}

/** Data URI de un SVG, para <img> dentro de next/og (favicon, OG). */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
