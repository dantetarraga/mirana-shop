import { Providers } from '@/shared/components/Providers'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const SITE_TITLE = 'MIRANA — Juguetes & Figuras'
const SITE_DESCRIPTION =
  'Figuras de colección, preventas exclusivas e importaciones directas. Tu tienda premium de coleccionables.'

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
  themeColor: '#0b1830',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${plusJakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          {children}

          <Toaster
            theme="dark"
            position="top-center"
            gap={10}
            icons={{
              success: <CheckCircle2 size={16} color="#3fcf7f" />,
              error: <XCircle size={16} color="#ff6644" />,
              warning: <AlertTriangle size={16} color="#ffb84a" />,
              info: <Info size={16} color="#8b7cff" />,
            }}
            toastOptions={{
              style: {
                background: 'var(--color-surf)',
                border: '1px solid var(--bd)',
                borderRadius: '0',
                boxShadow: '0 16px 40px oklch(0% 0 0 / 0.4), 0 0 0 1px var(--bd)',
                padding: '14px 16px',
              },
              classNames: {
                title:
                  'font-display font-extrabold uppercase tracking-[0.5px] text-[13px] text-text',
                description: '!text-muted text-[12px] normal-case tracking-normal font-sans mt-1',
                success: '!border-l-[3px] ![border-left-color:#3fcf7f]',
                error: '!border-l-[3px] ![border-left-color:#ff6644]',
                warning: '!border-l-[3px] ![border-left-color:#ffb84a]',
                info: '!border-l-[3px] ![border-left-color:#8b7cff]',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
