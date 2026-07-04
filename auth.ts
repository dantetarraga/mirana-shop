import { mergeAnonymousCartIntoUser } from '@/features/cart/lib/cart-resolve'
import { db } from '@/shared/lib/db'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
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
