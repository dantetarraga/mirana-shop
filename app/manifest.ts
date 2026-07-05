import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MIRANA — Juguetes & Figuras',
    short_name: 'MIRANA',
    description: 'Figuras de colección, preventas exclusivas e importaciones directas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1830',
    theme_color: '#0b1830',
    icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
  }
}
