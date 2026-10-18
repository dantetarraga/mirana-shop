import 'server-only'

import { createHash, timingSafeEqual } from 'crypto'

// ---------------------------------------------------------------------------
// isCronAuthorized — valida el `Authorization: Bearer <CRON_SECRET>` de las
// rutas /api/cron/*.
//
// Comparar con `!==` corta en el primer byte distinto y filtra por tiempo
// cuánto del secreto se acertó. Se hashean ambos lados (longitud fija, así
// timingSafeEqual no lanza ni revela la longitud) y se comparan en tiempo
// constante. Sin CRON_SECRET configurado, todo se rechaza.
// ---------------------------------------------------------------------------

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const header = req.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match) return false

  return timingSafeEqual(digest(match[1].trim()), digest(secret))
}
