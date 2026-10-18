'use client'

import { Button, buttonClass } from '@/shared/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

// Error dentro de la tienda: a diferencia de app/error.tsx, este vive dentro
// del layout del storefront, así que el navbar, el carrito y el footer quedan
// operativos y el cliente puede seguir navegando.
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[storefront] Error no controlado:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 py-16">
      <AlertTriangle size={72} strokeWidth={1} className="text-muted opacity-40" aria-hidden />
      <div className="text-center">
        <h1 className="font-display text-[26px] font-black uppercase tracking-tight">
          No pudimos cargar esta página
        </h1>
        <p className="text-muted text-[14px] mt-2 max-w-90 mx-auto">
          Tu carrito sigue guardado. Intenta de nuevo o vuelve al catálogo.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="accent" size="md" onClick={reset}>
          Reintentar
        </Button>
        <Link href="/catalogo" className={buttonClass({ variant: 'outline' })}>
          Ver catálogo
        </Link>
      </div>
    </div>
  )
}
