import { z } from 'zod'

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}

/** Ruta interna o URL http(s); rechaza javascript:, data: y URLs protocol-relative. */
export function safeHrefSchema(message = 'Enlace inválido', max = 500) {
  return z
    .string()
    .trim()
    .max(max)
    .refine((value) => value === '' || isInternalPath(value) || isHttpUrl(value), message)
}

/** URL web absoluta http(s), opcionalmente vacía. */
export function httpUrlSchema(message = 'URL inválida', max = 500) {
  return z
    .string()
    .trim()
    .max(max)
    .refine((value) => value === '' || isHttpUrl(value), message)
}

export function isAllowedHttpUrl(value: string): boolean {
  return isHttpUrl(value)
}

export function safeHref(value: string | null | undefined, fallback = ''): string {
  const normalized = (value ?? '').trim()
  return isInternalPath(normalized) || isHttpUrl(normalized) ? normalized : fallback
}
