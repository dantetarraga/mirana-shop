import {
  BRAND_COLORS,
  markSvg,
  svgDataUri,
  PALETTE_ON_DARK,
} from '@/shared/components/brand/brand-paths'
import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const MARK = svgDataUri(markSvg(PALETTE_ON_DARK))

export default function AppleIcon() {
  // iOS recorta las esquinas: el isotipo va con aire alrededor sobre navy.
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND_COLORS.navy,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={MARK} width={124} height={124} />
    </div>,
    size,
  )
}
