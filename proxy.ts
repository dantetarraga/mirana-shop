import { authConfig } from '@/auth.config'
import { legacyCatalogRedirect } from '@/features/products/lib/catalog-params'
import NextAuth from 'next-auth'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

// Instancia ligera de Auth.js: solo decodifica el JWT. Se construye desde
// auth.config.ts (sin Prisma) para no arrastrar la BD al bundle del proxy.
const { auth } = NextAuth(authConfig)

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
// En producción el destino usa NEXT_PUBLIC_SITE_URL. Esto evita que un Host o
// X-Forwarded-Host falsificado controle el Location del redirect.
// ---------------------------------------------------------------------------

/**
 * Origen público de la request. Detrás del proxy del hosting, `nextUrl.origin`
 * puede ser el interno, por eso mandan los headers `x-forwarded-*`.
 */
function publicOrigin(req: NextRequest): string {
  if (process.env.NODE_ENV === 'production') {
    const configured = process.env.NEXT_PUBLIC_SITE_URL
    if (!configured) throw new Error('NEXT_PUBLIC_SITE_URL no definida en producción')
    const url = new URL(configured)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('NEXT_PUBLIC_SITE_URL debe usar http o https')
    }
    return url.origin
  }

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!host) return req.nextUrl.origin
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  return `${proto}://${host}`
}

const authProxy = auth((req) => {
  const { pathname } = req.nextUrl

  if (req.auth) {
    // Chequeo optimista de rol: una sesión de cliente no entra a /admin. Es
    // solo la primera capa — el rol del JWT puede estar obsoleto, así que cada
    // page del admin vuelve a verificarlo contra la BD (verifyAdmin) y cada
    // action con requireAdmin().
    if (pathname.startsWith('/admin') && req.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', publicOrigin(req)))
    }
    return
  }

  // Ruta + query, para poder volver adonde el usuario quería ir.
  const target = `${pathname}${req.nextUrl.search}`

  // Absoluta y no relativa porque el wrapper de Auth.js hace `new URL()` sobre
  // el Location y una ruta suelta lo rompe con ERR_INVALID_URL.
  const url = new URL(`/?callbackUrl=${encodeURIComponent(target)}`, publicOrigin(req))
  return NextResponse.redirect(url)
})

/**
 * /catalogo?cat=x y /catalogo?brand=x (único parámetro) → 308 a la página
 * propia de la categoría o la marca. Se hace aquí y no solo en la page porque
 * /catalogo tiene loading.tsx: con streaming, permanentRedirect() sale como
 * 200 + meta refresh, y los buscadores necesitan el 308 real para trasladar
 * la URL. No pasa por Auth.js (no decodifica el JWT).
 */
function catalogRedirect(req: NextRequest): NextResponse {
  const destination = legacyCatalogRedirect(Object.fromEntries(req.nextUrl.searchParams))
  if (!destination) return NextResponse.next()
  return NextResponse.redirect(new URL(destination, publicOrigin(req)), 308)
}

export function proxy(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname === '/catalogo') return catalogRedirect(req)
  // Mismos argumentos que Next le pasaba antes al wrapper de Auth.js; su tipo
  // público solo declara la firma de route handler ({ params }).
  return authProxy(req, event as unknown as Parameters<typeof authProxy>[1])
}

export const config = {
  matcher: ['/cuenta/:path*', '/admin/:path*', '/catalogo'],
}
