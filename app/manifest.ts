import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MIRANA — Juguetes & Figuras',
    short_name: 'MIRANA',
    description:
      'Mirana Shop: juguetes, figuras de colección y modelos a escala 100% originales, con importación directa y calidad garantizada en Arequipa.',
    start_url: '/',
    display: 'standalone',
    // La app arranca en tema claro: la splash de la PWA debe coincidir.
    // El navy se mantiene como color de marca en theme_color, favicon y OG.
    background_color: '#ffffff',
    theme_color: '#0b1830',
    icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
  }
}
