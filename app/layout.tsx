import type { Metadata } from 'next'
import { Barlow_Condensed, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

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
  title: {
    default: 'MIRANA — Juguetes & Figuras',
    template: '%s | MIRANA',
  },
  description:
    'Figuras de colección, preventas exclusivas e importaciones directas. Tu tienda premium de coleccionables.',
  keywords: ['figuras', 'colección', 'anime', 'LEGO', 'preventa', 'importación', 'premium'],
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'MIRANA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${plusJakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-surf)',
              border: '1px solid var(--color-bd)',
              color: 'var(--color-text)',
            },
          }}
        />
      </body>
    </html>
  )
}
