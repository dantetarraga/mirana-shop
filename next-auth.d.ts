import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      role: 'admin' | 'customer'
    } & DefaultSession['user']
    /**
     * Versión de sesión del token (ver shared/lib/session-version.ts). Los
     * guards la comparan con `User.sessionVersion` en la BD.
     */
    sv: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'customer'
    /** Versión de sesión al iniciar sesión. Ausente en tokens antiguos (= 0). */
    sv?: number
    /** Última validación contra la BD en el callback jwt (epoch ms). */
    svCheckedAt?: number
  }
}
