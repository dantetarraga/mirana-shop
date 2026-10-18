import { BRAND_COLORS, markSvg, svgDataUri } from '@/shared/components/brand/brand-paths'
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Isotipo del logo (luna + flecha) sobre navy; mismo path que el navbar.
const MARK = svgDataUri(
  markSvg({ ink: BRAND_COLORS.white, moon: BRAND_COLORS.moonOnDark, bg: BRAND_COLORS.navy }),
)

export default function Icon() {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return new ImageResponse(<img src={MARK} width={32} height={32} />, size)
}
