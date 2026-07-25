'use client'

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'

/**
 * Sonner inyecta su propio set de variables CSS según su prop `theme`, así que
 * no basta con los tokens de globals.css: si se deja fijo, los toasts salen
 * oscuros en tema claro. Este wrapper lo sincroniza con next-themes.
 */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="top-center"
      gap={10}
      icons={{
        success: <CheckCircle2 size={16} color="var(--c-green)" />,
        error: <XCircle size={16} color="var(--c-red)" />,
        warning: <AlertTriangle size={16} color="var(--c-amber)" />,
        info: <Info size={16} color="var(--c-blue)" />,
      }}
      toastOptions={{
        duration: 1000,
        style: {
          background: 'var(--surf)',
          border: '1px solid var(--bd)',
          borderRadius: '0',
          boxShadow: 'var(--sh-pop), 0 0 0 1px var(--bd)',
          padding: '14px 16px',
        },
        classNames: {
          title: 'font-display font-extrabold uppercase tracking-[0.5px] text-[13px] text-text',
          description: '!text-muted text-[12px] normal-case tracking-normal font-sans mt-1',
          success: '!border-l-[3px] ![border-left-color:var(--c-green)]',
          error: '!border-l-[3px] ![border-left-color:var(--c-red)]',
          warning: '!border-l-[3px] ![border-left-color:var(--c-amber)]',
          info: '!border-l-[3px] ![border-left-color:var(--c-blue)]',
        },
      }}
    />
  )
}
