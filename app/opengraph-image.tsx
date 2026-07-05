import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          background: '#0b1830',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: 10,
            textTransform: 'uppercase',
            color: '#ffffff',
          }}
        >
          MIRA<span style={{ color: '#00c8ff' }}>NA</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#8a94a6',
          }}
        >
          Juguetes &amp; Figuras de Colección
        </div>
      </div>
    ),
    size,
  )
}
