'use client'

import { signOut } from 'next-auth/react'

/**
 * Cierra sesión y vuelve al inicio **del origen actual**.
 *
 * No se delega el redirect en NextAuth (`signOut({ redirectTo })`) porque
 * resuelve las rutas relativas contra `AUTH_URL`. Si esa variable quedó mal
 * configurada en el entorno donde corre la app (por ejemplo apuntando a
 * `http://localhost:3000` en el hosting), cerrar sesión en producción echaba al
 * usuario a localhost. Con `redirect: false` la sesión se borra igual y la
 * navegación la hace el navegador sobre el origen en el que ya está, así que
 * funciona sin importar cómo esté configurada la variable.
 */
export async function logout(): Promise<void> {
  await signOut({ redirect: false })
  window.location.assign('/')
}
