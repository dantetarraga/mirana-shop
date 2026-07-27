import { auth } from '@/auth'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Protege /cuenta y /admin.
//
// Antes era `export { auth as proxy }`, es decir el redirect por defecto de
// Auth.js. Ese redirect se construye con `AUTH_URL`, así que un entorno con esa
// variable mal puesta (por ejemplo `http://localhost:3000` en el hosting)
// echaba a los usuarios de producción a localhost — un 307 del servidor, antes
// de que corriera nada de JavaScript, así que no había arreglo posible desde el
// cliente.
//
// Acá el destino se arma con el host REAL de la request (el que reenvía el
// proxy del hosting), así que funciona en cualquier dominio sin depender de
// ninguna variable de entorno.
// ---------------------------------------------------------------------------

/**
 * Origen público de la request. Detrás del proxy del hosting, `nextUrl.origin`
 * puede ser el interno, por eso mandan los headers `x-forwarded-*`.
 */
function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!host) return req.nextUrl.origin
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  return `${proto}://${host}`
}

export const proxy = auth((req) => {
  if (req.auth) return

  // Ruta + query, para poder volver adonde el usuario quería ir.
  const target = `${req.nextUrl.pathname}${req.nextUrl.search}`

  // Absoluta y no relativa porque el wrapper de Auth.js hace `new URL()` sobre
  // el Location y una ruta suelta lo rompe con ERR_INVALID_URL.
  const url = new URL(`/?callbackUrl=${encodeURIComponent(target)}`, publicOrigin(req))
  return NextResponse.redirect(url)
})

export const config = {
  matcher: ['/cuenta/:path*', '/admin/:path*'],
}
