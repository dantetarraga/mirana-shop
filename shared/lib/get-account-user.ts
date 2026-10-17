import { auth } from '@/auth'
import type { SessionUser } from '@/shared/hooks/useUser'
import { db } from '@/shared/lib/db'
import { isSessionVersionValid } from '@/shared/lib/session-version'
import { redirect } from 'next/navigation'
import { cache } from 'react'

// ---------------------------------------------------------------------------
// getAccountUser — guard para las pages del área de cuenta (/cuenta).
//
// El JWT por sí solo no basta: la cuenta puede estar dada de baja o la sesión
// revocada (versión de sesión distinta a la de la BD). En cualquiera de los
// dos casos se trata como sin sesión y se redirige al inicio.
//
// Envuelto en cache(): el layout y la page de una misma request comparten una
// sola consulta a la BD.
// ---------------------------------------------------------------------------

export const getAccountUser = cache(async (): Promise<SessionUser> => {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { deletedAt: true, sessionVersion: true },
  })
  if (!user || user.deletedAt || !isSessionVersionValid(session.sv, user.sessionVersion)) {
    redirect('/')
  }

  return {
    name: session.user.name ?? session.user.email.split('@')[0],
    email: session.user.email,
    role: session.user.role,
  }
})
