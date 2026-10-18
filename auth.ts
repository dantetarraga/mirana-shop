import { authConfig } from '@/auth.config'
import { db } from '@/shared/lib/db'
import { consumeRateLimits, ipFromHeaders, RateLimitError } from '@/shared/lib/rate-limit'
import { isSessionVersionValid, shouldRecheckSession } from '@/shared/lib/session-version'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
// Google desactivado por ahora: para reactivarlo, descomentar este import,
// el proveedor de abajo y el botón en features/auth/components/AuthModal.tsx.
// import Google from 'next-auth/providers/google'
import { cache } from 'react'

// Ventana y topes del login con contraseña. Se cuentan TODOS los intentos
// (también los correctos) antes de bcrypt: así un atacante no puede usar el
// servidor como oráculo de contraseñas ni quemar CPU con hashes.
const LOGIN_WINDOW_MS = 15 * 60_000
const LOGIN_LIMIT_PER_EMAIL = 10
const LOGIN_LIMIT_PER_IP = 30

/**
 * Estado vigente de la cuenta para revalidar el token. Envuelto en cache(): en
 * un render del servidor auth() se llama varias veces (layout, page, guards) y
 * todas comparten una sola consulta. Fuera de un render, cache() no memoiza.
 */
const getSessionState = cache((email: string) =>
  db.user.findUnique({
    where: { email },
    select: { role: true, deletedAt: true, sessionVersion: true },
  }),
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    // Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        // Fuerza bruta: límite por cuenta (ataque dirigido) y por IP (barrido
        // de muchas cuentas). Superado el tope se responde igual que con una
        // credencial incorrecta.
        try {
          await consumeRateLimits([
            {
              scope: 'login-email',
              subject: email,
              limit: LOGIN_LIMIT_PER_EMAIL,
              windowMs: LOGIN_WINDOW_MS,
            },
            {
              scope: 'login-ip',
              subject: ipFromHeaders(request.headers),
              limit: LOGIN_LIMIT_PER_IP,
              windowMs: LOGIN_WINDOW_MS,
            },
          ])
        } catch (err) {
          if (err instanceof RateLimitError) return null
          throw err
        }

        const user = await db.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        // Cuenta dada de baja (ver deleteUser): se rechaza sin distinguirla de
        // una credencial incorrecta, para no filtrar qué emails existen.
        if (user.deletedAt) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Corta el acceso a las cuentas dadas de baja (`deletedAt`), en cualquier
     * proveedor. Hace falta además del chequeo en authorize() porque el alta de
     * Google ocurre en el callback jwt, que se ejecuta después: sin esto, un
     * usuario dado de baja volvería a entrar con Google.
     *
     * Esto solo bloquea logins nuevos. Las sesiones ya emitidas se cortan por
     * la versión de sesión: deleteUser la incrementa (ver jwt() y los guards
     * de shared/lib).
     */
    async signIn({ user, account, profile }) {
      // Google solo cuenta como prueba de propiedad del correo si Google lo
      // verificó; el flujo de pre-apropiación de jwt() depende de esto.
      if (account?.provider === 'google' && profile?.email_verified !== true) return false

      if (!user?.email) return true
      const existing = await db.user.findUnique({
        where: { email: user.email },
        select: { deletedAt: true },
      })
      return !existing?.deletedAt
    },

    /**
     * Añade el role y la versión de sesión (`sv`) al token JWT en cada login.
     * - Credentials: llegan en `user` desde authorize().
     * - Google: busca en DB o crea el usuario con role CUSTOMER.
     *
     * En el resto de llamadas (auth() en el servidor, /api/auth/session)
     * revalida el token contra la BD como mucho cada SESSION_RECHECK_MS:
     * devolver null invalida la sesión si la versión cambió (revocada), la
     * cuenta está dada de baja o el rol ya no coincide. Los guards de
     * shared/lib comparan `sv` en cada request; esto cubre lo que solo mira
     * auth() (cabecera, useSession) y acota la vida de un token revocado.
     */
    async jwt({ token, user, account }) {
      if (user) {
        // Primer login: `user` está presente
        if (account?.provider === 'google') {
          const email = token.email!
          const existing = await db.user.findUnique({
            where: { email },
            select: { id: true, emailVerified: true, passwordHash: true },
          })

          // Pre-apropiación de cuenta: el registro con contraseña no verifica
          // el correo, así que cualquiera puede crear una cuenta con el email
          // de otra persona y esperar a que esa persona entre con Google — el
          // upsert reutilizaba la fila y la contraseña del atacante seguía
          // valiendo. Google sí prueba la propiedad del correo: si la cuenta
          // nunca se verificó, se descarta la contraseña (y cualquier sesión
          // en BD) y se marca verificada. Si el dueño legítimo se había
          // registrado con contraseña, pierde ese método y sigue entrando con
          // Google. Se sube además la versión de sesión: los JWT que el
          // atacante obtuviera con su contraseña dejan de valer.
          if (existing && !existing.emailVerified) {
            await db.$transaction([
              db.session.deleteMany({ where: { userId: existing.id } }),
              db.user.update({
                where: { id: existing.id },
                data: {
                  emailVerified: new Date(),
                  passwordHash: null,
                  sessionVersion: { increment: 1 },
                },
              }),
            ])
          }

          const dbUser = await db.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              emailVerified: new Date(),
              name: token.name ?? null,
              image: token.picture ?? null,
              role: 'CUSTOMER',
            },
          })
          token.role = dbUser.role === 'ADMIN' ? 'admin' : 'customer'
          token.sv = dbUser.sessionVersion
        } else {
          // Credentials: role y versión vienen del authorize()
          const u = user as typeof user & { role?: string; sessionVersion?: number }
          token.role = u.role === 'ADMIN' ? 'admin' : 'customer'
          token.sv = u.sessionVersion ?? 0
        }
        token.svCheckedAt = Date.now()
        return token
      }

      // Revalidación periódica de una sesión ya emitida.
      const now = Date.now()
      if (!token.email || !shouldRecheckSession(token.svCheckedAt, now)) return token

      try {
        const state = await getSessionState(token.email)
        if (!state || state.deletedAt) return null
        if (!isSessionVersionValid(token.sv, state.sessionVersion)) return null
        if ((state.role === 'ADMIN' ? 'admin' : 'customer') !== token.role) return null
      } catch {
        // BD caída: no se cierra la sesión por un fallo transitorio. Los
        // guards de shared/lib vuelven a consultar la BD en cada acción
        // sensible, así que esto no abre acceso; se reintenta en la próxima.
        return token
      }

      token.svCheckedAt = now
      return token
    },
  },

  events: {
    /**
     * Fusiona el carrito anónimo (cookie) hacia la cuenta en cada login.
     * Cubre Google (redirect completo, sin punto de hook en el cliente) y
     * Credentials (también cubierto explícitamente en AuthModal porque ahí
     * no hay recarga de página tras el login).
     *
     * Import dinámico: cart-resolve importa `auth` de este archivo, y el import
     * estático cerraba un ciclo auth.ts ↔ cart-resolve.ts.
     */
    async signIn({ user }) {
      if (!user?.email) return
      const { mergeAnonymousCartIntoUser } = await import('@/features/cart/lib/cart-resolve')
      await mergeAnonymousCartIntoUser(user.email)
    },
  },
})
