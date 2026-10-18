// Genera los SVG estáticos del logo a partir de shared/components/brand/brand-paths.ts.
// Uso: pnpm tsx scripts/build-logo.ts
//   public/logo.svg       → para fondos claros (correos, JSON-LD)
//   public/logo-dark.svg  → para fondos oscuros
//   public/logo-mark.svg  → solo las garras sobre navy (avatar, redes)
import { writeFileSync } from 'node:fs'
import {
  BRAND_COLORS,
  logoSvg,
  markSvg,
  PALETTE_ON_DARK,
  PALETTE_ON_LIGHT,
} from '../shared/components/brand/brand-paths'

writeFileSync('public/logo.svg', logoSvg(PALETTE_ON_LIGHT))
writeFileSync('public/logo-dark.svg', logoSvg(PALETTE_ON_DARK))
writeFileSync('public/logo-mark.svg', markSvg({ ...PALETTE_ON_DARK, bg: BRAND_COLORS.navy }))
console.log('Logos generados en public/')
