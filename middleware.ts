import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Protege las rutas /cuenta/* verificando la cookie de sesión `m-auth`.
 * La cookie la establece el Zustand store al autenticarse/logout desde el cliente.
 */
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('m-auth')

  if (!authCookie?.value) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('requireAuth', '1')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cuenta/:path*'],
}
