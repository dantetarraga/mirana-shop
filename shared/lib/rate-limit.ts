import 'server-only'

import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'
import { db } from '@/shared/lib/db'
import { createHmac } from 'crypto'
import { headers } from 'next/headers'

export class RateLimitError extends Error {
  constructor(message = 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.') {
    super(message)
    this.name = 'RateLimitError'
  }
}

type LimitRule = {
  scope: string
  subject: string
  limit: number
  windowMs: number
}

/** Variable de entorno con valor útil: `RATE_LIMIT_SECRET=""` cuenta como no definida. */
function envSecret(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function rateLimitSecret(): string {
  // Con `??` una cadena vacía (la plantilla .env.example la deja así) no caía a
  // AUTH_SECRET y todas las actions limitadas fallaban en producción.
  const secret =
    envSecret('RATE_LIMIT_SECRET') ?? envSecret('AUTH_SECRET') ?? envSecret('NEXTAUTH_SECRET')
  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') return 'mirana-development-rate-limit-secret'
  throw new Error('Rate limit sin secreto: define RATE_LIMIT_SECRET o AUTH_SECRET')
}

function bucketKey(rule: LimitRule, now: Date): { key: string; expiresAt: Date } {
  const bucket = Math.floor(now.getTime() / rule.windowMs)
  const expiresAt = new Date((bucket + 1) * rule.windowMs)
  const key = createHmac('sha256', rateLimitSecret())
    .update(`${rule.scope}:${rule.subject.trim().toLowerCase()}:${bucket}`)
    .digest('hex')
  return { key, expiresAt }
}

async function consumeRule(tx: TransactionClient, rule: LimitRule, now: Date): Promise<void> {
  const { key, expiresAt } = bucketKey(rule, now)
  const bucket = await tx.rateLimitBucket.upsert({
    where: { key },
    update: { count: { increment: 1 } },
    create: { key, count: 1, expiresAt },
    select: { count: true },
  })
  if (bucket.count > rule.limit) throw new RateLimitError()
}

/** Consume varios límites de forma atómica (por ejemplo, uno por IP y otro por email). */
export async function consumeRateLimits(rules: LimitRule[]): Promise<void> {
  const now = new Date()
  await db.$transaction(async (tx) => {
    for (const rule of rules) await consumeRule(tx, rule, now)
  })
}

/**
 * IP observada por el proxy a partir de unos headers concretos (p. ej. el
 * `Request` que Auth.js pasa a authorize()). Solo se usa como entrada de un
 * HMAC, nunca se persiste.
 */
export function ipFromHeaders(requestHeaders: Headers): string {
  return (
    requestHeaders.get('cf-connecting-ip') ??
    requestHeaders.get('x-real-ip') ??
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  ).slice(0, 128)
}

/** IP observada por el proxy en la request en curso (Server Actions, pages). */
export async function requestIp(): Promise<string> {
  return ipFromHeaders(await headers())
}

export async function purgeExpiredRateLimits(now: Date = new Date()): Promise<number> {
  const result = await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } })
  return result.count
}
