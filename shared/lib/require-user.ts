import { auth } from '@/auth'
import type { AdminDenied } from '@/shared/lib/require-admin'
import { db } from '@/shared/lib/db'
import { isSessionVersionValid } from '@/shared/lib/session-version'

// ---------------------------------------------------------------------------
// requireUser — guard de autenticación para Server Actions del área de cuenta.
//
// A diferencia de getAccountUser() (que hace redirect('/') y solo sirve en
// pages), esto devuelve un resultado que la action puede inspeccionar sin
// abandonar el flujo. El email SIEMPRE se deriva de la sesión: nunca se acepta
// como parámetro del cliente — una Server Action es un endpoint público.
//
// Uso:
//   const session = await requireUser()
//   if ('denied' in session) return session.denied   // o `return null` en reads
//   const { email } = session
// ---------------------------------------------------------------------------

export type RequireUserResult =
  | { id: string; email: string; denied?: never }
  | { denied: AdminDenied; id?: never; email?: never }

export async function requireUser(): Promise<RequireUserResult> {
  const session = await auth()

  if (!session?.user?.email) {
    return { denied: { success: false, error: 'Debes iniciar sesión', code: 401 } }
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, deletedAt: true, sessionVersion: true },
  })
  // Baja o sesión revocada (versión distinta a la del token): sin sesión.
  if (!user || user.deletedAt || !isSessionVersionValid(session.sv, user.sessionVersion)) {
    return { denied: { success: false, error: 'La sesión ya no es válida', code: 401 } }
  }

  return { id: user.id, email: user.email }
}
