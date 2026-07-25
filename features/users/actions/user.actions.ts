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
// `deletedAt`. Una sesión JWT ya emitida sigue siendo válida hasta que expira;
// ver la nota en ese archivo.
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
      db.user.update({ where: { id }, data: { deletedAt: new Date() } }),
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
