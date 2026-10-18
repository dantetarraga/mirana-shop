import { BRAND_COLORS, logoSvg, svgDataUri } from '@/shared/components/brand/brand-paths'
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LOGO = svgDataUri(logoSvg({ ink: BRAND_COLORS.white, moon: BRAND_COLORS.moonOnDark }))

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLORS.navy,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={LOGO} width={672} height={160} />
        <div style={{ display: 'flex', marginTop: 36, fontSize: 32, color: '#a9b8cc' }}>
          Figuras de colección, LEGO y modelos a escala originales
        </div>
      </div>
    ),
    size,
  )
}
