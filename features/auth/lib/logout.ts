'use client'

import { signOut } from 'next-auth/react'

/**
 * Cierra sesión y vuelve al inicio **del origen actual**.
 *
 * El redirect no se delega en NextAuth: con `redirect: true` la navegación la
 * hace la librería contra la URL que valida el servidor, que se resuelve con
 * `AUTH_URL`. Si esa variable está mal en el entorno (p. ej. apuntando a
 * `http://localhost:3000` en el hosting), el usuario termina en localhost.
 *
 * Con `redirect: false` la sesión se borra igual y la navegación la hace el
 * navegador sobre el origen en el que ya está, así que no depende de la
 * variable. Ver también `proxy.ts`, que tenía el mismo problema del lado del
 * servidor al proteger /cuenta y /admin.
 */
export async function logout(): Promise<void> {
  await signOut({ redirect: false })
  window.location.assign('/')
}
