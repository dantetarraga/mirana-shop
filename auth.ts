import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    /**
     * Controla el acceso a rutas protegidas.
     * El proxy (proxy.ts) llama a esto para cada request que coincide con el matcher.
     */
    authorized({ auth: session, request: { nextUrl } }) {
      if (!session?.user) {
        return Response.redirect(new URL('/?requireAuth=1', nextUrl))
      }
      return true
    },
  },
})
