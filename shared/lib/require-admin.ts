import 'server-only'

import { auth } from '@/auth'
import { db } from '@/shared/lib/db'
import { redirect } from 'next/navigation'
import { cache } from 'react'

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

  if (!session.user.email || session.user.role !== 'admin') {
    return { success: false, error: 'No tienes permisos de administrador', code: 403 }
  }

  // El rol del JWT puede quedar obsoleto después de una baja o cambio de rol.
  // Cada mutación sensible vuelve a verificar el estado vigente en la BD.
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, deletedAt: true },
  })
  if (!user || user.deletedAt || user.role !== 'ADMIN') {
    return { success: false, error: 'No tienes permisos de administrador', code: 403 }
  }

  return null
}

// ---------------------------------------------------------------------------
// verifyAdmin — guard para Server Components del admin (pages y queries).
//
// El layout de /admin no es una barrera de seguridad: con Partial Rendering
// una navegación puede renderizar solo la page sin volver a ejecutar el
// layout, y el proxy solo mira el rol del JWT (que puede estar obsoleto). Por
// eso cada page.tsx de /admin llama a esto al inicio, igual que cada action
// llama a requireAdmin().
//
// Envuelto en cache(): la page, el layout y las queries de una misma request
// comparten una sola consulta a la BD.
// ---------------------------------------------------------------------------

export const verifyAdmin = cache(async (): Promise<{ email: string }> => {
  const session = await auth()
  const email = session?.user?.email
  if (!email || session.user.role !== 'admin') redirect('/')

  // Igual que requireAdmin: el rol del JWT puede haber cambiado (baja o
  // degradación), así que se contrasta con el estado vigente en la BD.
  const user = await db.user.findUnique({
    where: { email },
    select: { role: true, deletedAt: true },
  })
  if (!user || user.deletedAt || user.role !== 'ADMIN') redirect('/')

  return { email }
})
