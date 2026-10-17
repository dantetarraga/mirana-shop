/**
 * Filas por página en las tablas del admin. Un único valor para todo el panel
 * — se prefiere una página corta y navegable antes que cargar tablas enteras.
 */
export const ADMIN_PER_PAGE = 15

/**
 * Normaliza el parámetro `?page=` de las páginas del admin. Acepta lo que
 * llega de `searchParams` (string, array o undefined) y devuelve siempre un
 * entero positivo seguro; cualquier otro valor ("abc", "-3", "2.5", "1e999")
 * cae a la primera página para no enviar `skip` inválidos a Prisma.
 */
export function parsePage(raw: unknown): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' && typeof value !== 'number') return 1
  if (typeof value === 'string' && value.trim() === '') return 1
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 ? n : 1
}
