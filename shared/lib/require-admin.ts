import { auth } from '@/auth'

// ---------------------------------------------------------------------------
// requireAdmin — guard de autorización para Server Actions del admin.
//
// Uso al inicio de cada action:
//   const denied = await requireAdmin()
//   if (denied) return denied
//
// Retorna null si la sesión es válida y tiene rol admin; de lo contrario
// retorna un ActionResult de error listo para devolver al cliente.
// ---------------------------------------------------------------------------

export type AdminDenied = { success: false; error: string; code: 401 | 403 }

export async function requireAdmin(): Promise<AdminDenied | null> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: 'Debes iniciar sesión', code: 401 }
  }

  if (session.user.role !== 'admin') {
    return { success: false, error: 'No tienes permisos de administrador', code: 403 }
  }

  return null
}
