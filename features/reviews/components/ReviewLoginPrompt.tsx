'use client'

import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import { Button } from '@/shared/components/ui/Button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Invitado: abre el modal de inicio de sesión. El modal inicia sesión sin
 * recargar la página, así que al detectar la sesión se refresca la sección
 * (el servidor vuelve a renderizarla, ahora con el formulario).
 */
export function ReviewLoginPrompt() {
  const openAuth = useAuthModalStore((s) => s.openAuth)
  const { status } = useSession()
  const router = useRouter()

  // Solo en la transición invitado → sesión: si el servidor y el cliente no
  // coinciden (token revocado) no se entra en un bucle de refrescos.
  const prevStatus = useRef(status)
  useEffect(() => {
    if (prevStatus.current === 'unauthenticated' && status === 'authenticated') router.refresh()
    prevStatus.current = status
  }, [status, router])

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-[14px] text-muted max-w-[44ch]">
        Para opinar necesitas una cuenta. Así sabemos que cada opinión viene de un cliente real.
      </p>
      <Button variant="outline" size="md" onClick={() => openAuth('login')}>
        Inicia sesión para dejar tu opinión
      </Button>
    </div>
  )
}
