'use client'

import { Button } from '@/shared/components/ui/Button'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Error boundary del segmento /admin. Sin este archivo, cualquier excepción
// no controlada en una página o componente cliente del admin (p. ej. un bug
// de render en un preview de importación) tumba toda la pantalla con el
// overlay crudo de Next. Con esto se conserva el sidebar/topbar y se ofrece
// una salida clara al usuario.
// ---------------------------------------------------------------------------

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin] Error no controlado:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <AlertTriangle size={56} strokeWidth={1} className="text-red-400/70" />
      <div>
        <h1 className="font-display text-[22px] font-black uppercase tracking-tight">
          Ocurrió un error inesperado
        </h1>
        <p className="text-muted text-[14px] mt-2 max-w-100">
          Algo falló al procesar esta acción. Intenta de nuevo; si el problema persiste, revisa el
          archivo o los datos que estás usando.
        </p>
        {error.message && (
          <p className="text-[12px] text-red-400/80 font-mono mt-3 max-w-120 break-words">
            {error.message}
          </p>
        )}
      </div>
      <Button variant="accent" size="md" onClick={reset}>
        <RotateCcw size={15} />
        Reintentar
      </Button>
    </div>
  )
}
