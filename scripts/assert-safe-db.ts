import 'dotenv/config'

const value = process.env.DATABASE_URL
if (!value) throw new Error('DATABASE_URL no definida')

const url = new URL(value)
const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
const explicitApproval = process.env.ALLOW_REMOTE_DB_WRITE === 'I_UNDERSTAND'

if (!localHosts.has(url.hostname) && !explicitApproval) {
  throw new Error(
    `Operación bloqueada: DATABASE_URL apunta a ${url.hostname}. ` +
      'Usa una base local/de desarrollo o define ALLOW_REMOTE_DB_WRITE=I_UNDERSTAND de forma explícita.',
  )
}
