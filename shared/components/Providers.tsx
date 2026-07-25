'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* `class` porque globals.css resuelve el tema con `.dark` en <html>.
          enableSystem=false a propósito: el sitio arranca en claro sin importar
          la preferencia del SO; el visitante cambia con el toggle de la navbar. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
