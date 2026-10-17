import type { NextAuthConfig } from 'next-auth'

// ---------------------------------------------------------------------------
// Configuración de Auth.js compartida por proxy.ts y auth.ts.
//
// Este archivo NO puede importar Prisma ni nada que toque la BD: proxy.ts lo
// usa para decodificar el JWT en cada request a /cuenta y /admin, y meter
// `db` aquí arrastraría el cliente de Prisma (y su pool de conexiones) al
// bundle del proxy. Los providers y los callbacks que consultan la BD
// (signIn, jwt) viven solo en auth.ts.
// ---------------------------------------------------------------------------

export const authConfig = {
  // El origen se deriva del host de la request (X-Forwarded-Host detrás del
  // proxy del hosting) en vez de una URL fija. Sin esto, NextAuth usa AUTH_URL
  // como base para resolver los redirects relativos, y `.env` la tenía en
  // http://localhost:3000: cerrar sesión en producción mandaba a localhost.
  trustHost: true,

  providers: [],

  session: { strategy: 'jwt' },

  callbacks: {
    /** Expone el role en el objeto session.user */
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role ?? 'customer') as 'admin' | 'customer'
      }
      return session
    },
  },

  pages: {
    signIn: '/', // Modal propio, no ruta /auth/signin de NextAuth
    error: '/',
  },
} satisfies NextAuthConfig
