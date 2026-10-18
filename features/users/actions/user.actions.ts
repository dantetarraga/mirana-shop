'use server'

import { auth } from '@/auth'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// deleteUser — baja de cuenta (soft delete)
//
// El borrado es lógico porque Order y Preorder apuntan al usuario con FK
// RESTRICT: un pedido pasado no puede quedarse sin cliente. La cuenta queda en
// /admin/trash, desde donde se puede restaurar o —si nunca compró— borrar de
// verdad.
//
// El corte de acceso lo aplica auth.ts, que rechaza el login de una cuenta con
// `deletedAt`. Las sesiones JWT ya emitidas se revocan subiendo la versión de
// sesión (ver shared/lib/session-version.ts).
// ---------------------------------------------------------------------------

export async function deleteUser(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de usuario requerido', code: 400 }

  try {
    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, deletedAt: true },
    })
    if (!target || target.deletedAt) {
      return { success: false, error: 'Usuario no encontrado', code: 404 }
    }

    // Nadie se da de baja a sí mismo desde el admin: dejaría la sesión en un
    // estado incoherente y, si es el único admin, la tienda sin administrador.
    const session = await auth()
    if (session?.user?.email && session.user.email === target.email) {
      return { success: false, error: 'No puedes dar de baja tu propia cuenta', code: 422 }
    }

    if (target.role === 'ADMIN') {
      return {
        success: false,
        error: 'No se puede dar de baja una cuenta de administrador',
        code: 422,
      }
    }

    // El carrito es estado vivo, no historial: se elimina para no dejar
    // reservas colgando de una cuenta inactiva (CartItem cascadea).
    await db.$transaction([
      db.cart.deleteMany({ where: { userId: id } }),
      db.user.update({
        where: { id },
        data: { deletedAt: new Date(), sessionVersion: { increment: 1 } },
      }),
    ])

    revalidatePath('/admin/users')
    revalidatePath('/admin/trash')
    revalidatePath('/admin/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al dar de baja al usuario'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// revokeUserSessions — "Cerrar sesiones" de una cuenta
//
// Sube la versión de sesión del usuario: todos sus JWT emitidos dejan de valer
// en los guards al instante y en auth() en como mucho SESSION_RECHECK_MS. Útil
// ante un dispositivo perdido o una sospecha de robo de sesión. Si el admin lo
// aplica a su propia cuenta, también se cierra su sesión actual.
// ---------------------------------------------------------------------------

export async function revokeUserSessions(id: string): Promise<ActionResult<{ self: boolean }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de usuario requerido', code: 400 }

  try {
    const target = await db.user.update({
      where: { id, deletedAt: null },
      data: { sessionVersion: { increment: 1 } },
      select: { email: true },
    })

    // `self` avisa al cliente de que su propia sesión acaba de caer, para que
    // cierre sesión en vez de quedarse con un token que ya no vale.
    const session = await auth()
    return { success: true, data: { self: session?.user?.email === target.email } }
  } catch (err) {
    // P2025: no existe o ya está dada de baja.
    if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2025') {
      return { success: false, error: 'Usuario no encontrado', code: 404 }
    }
    const message = err instanceof Error ? err.message : 'Error al cerrar las sesiones'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// revokeAllSessions — "Cerrar todas las sesiones"
//
// Sube la versión de sesión de TODAS las cuentas, incluida la del admin que lo
// ejecuta: después tiene que volver a iniciar sesión. Es además la forma de
// revocar los tokens emitidos antes de existir la versión de sesión (que no
// traen `sv` y cuentan como 0).
// ---------------------------------------------------------------------------

export async function revokeAllSessions(): Promise<ActionResult<{ count: number }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { count } = await db.user.updateMany({
      data: { sessionVersion: { increment: 1 } },
    })
    return { success: true, data: { count } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cerrar las sesiones'
    return { success: false, error: message, code: 500 }
  }
}
