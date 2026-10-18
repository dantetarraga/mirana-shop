import 'server-only'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Variables de entorno del servidor, validadas con zod.
//
// Se leen de forma perezosa (en la primera llamada, no al importar) para que
// los tests y los scripts que importan módulos sueltos no fallen por variables
// que no usan. El resultado se memoriza: la validación corre una sola vez por
// proceso.
//
// Antes cada archivo hacía `process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'`
// y un deploy sin la variable publicaba canonical, sitemap y JSON-LD apuntando
// a localhost sin que nadie se enterara. En producción ahora falla en voz alta.
// ---------------------------------------------------------------------------

const DEV_SITE_URL = 'http://localhost:3000'

const isProduction = process.env.NODE_ENV === 'production'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

const siteUrlSchema = z
  .string()
  .trim()
  .url('NEXT_PUBLIC_SITE_URL debe ser una URL absoluta')
  .transform((value) => value.replace(/\/+$/, ''))
  .superRefine((value, ctx) => {
    if (!isProduction) return
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      ctx.addIssue({ code: 'custom', message: 'NEXT_PUBLIC_SITE_URL debe usar https en producción' })
    }
    if (LOCAL_HOSTS.has(url.hostname)) {
      ctx.addIssue({
        code: 'custom',
        message: 'NEXT_PUBLIC_SITE_URL no puede apuntar a localhost en producción',
      })
    }
  })

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // En desarrollo se tolera la ausencia y se usa localhost; en producción es
  // obligatoria (ver siteUrlSchema).
  NEXT_PUBLIC_SITE_URL: isProduction ? siteUrlSchema : siteUrlSchema.default(DEV_SITE_URL),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL no definida'),
  AUTH_SECRET: isProduction ? z.string().min(1, 'AUTH_SECRET no definida') : z.string().optional(),
  CRON_SECRET: z.string().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || 'env'}: ${i.message}`).join('; ')
}

let serverEnv: ServerEnv | null = null

/** Entorno completo del servidor. Lanza si falta algo obligatorio. */
export function getServerEnv(): ServerEnv {
  if (serverEnv) return serverEnv
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Variables de entorno inválidas — ${formatIssues(parsed.error)}`)
  }
  serverEnv = parsed.data
  return serverEnv
}

let siteUrl: string | null = null

/**
 * URL pública del sitio, sin slash final. Solo valida NEXT_PUBLIC_SITE_URL:
 * la usan metadata, sitemap y robots, que no necesitan el resto del entorno.
 */
export function getSiteUrl(): string {
  if (siteUrl) return siteUrl
  const schema = isProduction ? siteUrlSchema : siteUrlSchema.default(DEV_SITE_URL)
  const parsed = schema.safeParse(process.env.NEXT_PUBLIC_SITE_URL || undefined)
  if (!parsed.success) {
    throw new Error(`Variables de entorno inválidas — ${formatIssues(parsed.error)}`)
  }
  siteUrl = parsed.data
  return siteUrl
}
