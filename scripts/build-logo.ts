// Genera los SVG estáticos del logo a partir de shared/components/brand/brand-paths.ts.
// Uso: pnpm tsx scripts/build-logo.ts
//   public/logo.svg       → tinta navy (fondos claros: correos, JSON-LD, OG)
//   public/logo-dark.svg  → tinta blanca (fondos oscuros)
//   public/logo-mark.svg  → solo isotipo sobre navy (avatar, redes)
import { writeFileSync } from 'node:fs'
import { BRAND_COLORS, logoSvg, markSvg } from '../shared/components/brand/brand-paths'

writeFileSync('public/logo.svg', logoSvg({ ink: BRAND_COLORS.navy, moon: BRAND_COLORS.moonOnLight }))
writeFileSync('public/logo-dark.svg', logoSvg({ ink: BRAND_COLORS.white, moon: BRAND_COLORS.moonOnDark }))
writeFileSync(
  'public/logo-mark.svg',
  markSvg({ ink: BRAND_COLORS.white, moon: BRAND_COLORS.moonOnDark, bg: BRAND_COLORS.navy }),
)
console.log('Logos generados en public/')
