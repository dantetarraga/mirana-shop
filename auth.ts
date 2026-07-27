import { mergeAnonymousCartIntoUser } from '@/features/cart/lib/cart-resolve'
import { db } from '@/shared/lib/db'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  // El origen se deriva del host de la request (X-Forwarded-Host detrás del
  // proxy del hosting) en vez de una URL fija. Sin esto, NextAuth usa AUTH_URL
  // como base para resolver los redirects relativos, y `.env` la tenía en
  // http://localhost:3000: cerrar sesión en producción mandaba a localhost.
  trustHost: true,

  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        // Cuenta dada de baja (ver deleteUser): se rechaza sin distinguirla de
        // una credencial incorrecta, para no filtrar qué emails existen.
        if (user.deletedAt) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    /**
     * Corta el acceso a las cuentas dadas de baja (`deletedAt`), en cualquier
     * proveedor. Hace falta además del chequeo en authorize() porque el alta de
     * Google ocurre en el callback jwt, que se ejecuta después: sin esto, un
     * usuario dado de baja volvería a entrar con Google.
     *
     * Ojo: la sesión es JWT, así que esto solo bloquea logins nuevos. Un token
     * ya emitido sigue siendo válido hasta que expira — cortar una sesión en
     * curso exigiría consultar la BD en cada request.
     */
    async signIn({ user }) {
      if (!user?.email) return true
      const existing = await db.user.findUnique({
        where: { email: user.email },
        select: { deletedAt: true },
      })
      return !existing?.deletedAt
    },

    /**
     * Añade el role al token JWT en cada login.
     * - Credentials: llega en `user.role` desde authorize().
     * - Google: busca en DB o crea el usuario con role CUSTOMER.
     */
    async jwt({ token, user, account }) {
      if (user) {
        // Primer login: `user` está presente
        if (account?.provider === 'google') {
          const dbUser = await db.user.upsert({
            where: { email: token.email! },
            update: {},
            create: {
              email: token.email!,
              name: token.name ?? null,
              image: token.picture ?? null,
              role: 'CUSTOMER',
            },
          })
          token.role = dbUser.role === 'ADMIN' ? 'admin' : 'customer'
        } else {
          // Credentials: el role viene del authorize()
          const u = user as typeof user & { role?: string }
          token.role = u.role === 'ADMIN' ? 'admin' : 'customer'
        }
      }
      return token
    },

    /** Expone el role en el objeto session.user */
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role ?? 'customer') as 'admin' | 'customer'
      }
      return session
    },

    /**
     * Protección de rutas (chequeo optimista desde proxy.ts):
     * - /admin/* exige sesión con rol admin.
     * - El resto de rutas del matcher (/cuenta/*) solo exige sesión.
     * La autorización real vive en requireAdmin() dentro de cada action.
     */
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl

      if (pathname.startsWith('/admin')) {
        return session?.user?.role === 'admin'
      }

      return !!session?.user
    },
  },

  pages: {
    signIn: '/', // Modal propio, no ruta /auth/signin de NextAuth
    error: '/',
  },

  events: {
    /**
     * Fusiona el carrito anónimo (cookie) hacia la cuenta en cada login.
     * Cubre Google (redirect completo, sin punto de hook en el cliente) y
     * Credentials (también cubierto explícitamente en AuthModal porque ahí
     * no hay recarga de página tras el login).
     */
    async signIn({ user }) {
      if (user?.email) await mergeAnonymousCartIntoUser(user.email)
    },
  },
})
