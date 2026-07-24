import { auth } from '@/auth'
import type { AdminDenied } from '@/shared/lib/require-admin'

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

export type RequireUserResult = { email: string; denied?: never } | { denied: AdminDenied; email?: never }

export async function requireUser(): Promise<RequireUserResult> {
  const session = await auth()

  if (!session?.user?.email) {
    return { denied: { success: false, error: 'Debes iniciar sesión', code: 401 } }
  }

  return { email: session.user.email }
}
