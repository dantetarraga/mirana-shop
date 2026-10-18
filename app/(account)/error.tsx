'use client'

import { Button, buttonClass } from '@/shared/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

// Error boundary del área de cuenta: conserva navbar y footer del layout, a
// diferencia del error raíz, que reemplaza toda la página.
export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[cuenta] Error no controlado:', error)
  }, [error])

  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16 flex flex-col items-center gap-6 text-center">
      <AlertTriangle size={64} strokeWidth={1} className="opacity-20" aria-hidden />
      <div>
        <h1 className="font-display text-[26px] font-black uppercase tracking-tight">
          No pudimos cargar tu cuenta
        </h1>
        <p className="text-muted text-[14px] mt-2 max-w-90 mx-auto">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver a la tienda.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="accent" size="md" onClick={reset}>
          Reintentar
        </Button>
        <Link href="/" className={buttonClass({ variant: 'outline' })}>
          Ir a la tienda
        </Link>
      </div>
    </div>
  )
}
