import { Providers } from '@/shared/components/Providers'
import { ThemedToaster } from '@/shared/components/ThemedToaster'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const SITE_TITLE = 'MIRANA — Juguetes & Figuras'
const SITE_DESCRIPTION =
  'Mirana Shop: juguetes, figuras de colección y modelos a escala 100% originales, con importación directa y calidad garantizada en Arequipa.'

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | MIRANA',
  },
  description: SITE_DESCRIPTION,
  keywords: ['figuras', 'colección', 'anime', 'LEGO', 'preventa', 'importación', 'premium'],
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'MIRANA',
    url: BASE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'MIRANA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1830' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning va en <html>: next-themes escribe la clase del
    // tema ahí antes de la hidratación y el servidor no puede conocerla.
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${plusJakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1000] focus:bg-(--gold) focus:text-on-accent focus:px-4 focus:py-2 focus:font-display focus:font-bold focus:uppercase focus:tracking-[1px]"
        >
          Saltar al contenido
        </a>
        <Providers>
          {children}
          <ThemedToaster />
        </Providers>
      </body>
    </html>
  )
}
