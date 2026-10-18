'use client'

import { Button, buttonClass } from '@/shared/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] Error no controlado:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-bg text-text">
      <AlertTriangle size={80} strokeWidth={1} className="opacity-20" aria-hidden />
      <div className="text-center">
        <h1 className="font-display text-[26px] font-black uppercase tracking-tight">
          Algo salió mal
        </h1>
        <p className="text-muted text-[14px] mt-2 max-w-90">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="accent" size="md" onClick={reset}>
          Reintentar
        </Button>
        <Link href="/" className={buttonClass({ variant: 'outline' })}>
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
