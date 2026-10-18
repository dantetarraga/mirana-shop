// ---------------------------------------------------------------------------
// Resumen de calificaciones a partir de los conteos por estrella (groupBy).
// Puro, sin Prisma: se testea aparte.
// ---------------------------------------------------------------------------

export type RatingValue = 1 | 2 | 3 | 4 | 5
export type RatingDistribution = Record<RatingValue, number>

export interface ReviewSummary {
  /** Promedio con 1 decimal; 0 si no hay reseñas. */
  average: number
  count: number
  distribution: RatingDistribution
}

/** De 5 a 1: el orden en que se pintan las barras. */
export const RATING_VALUES: readonly RatingValue[] = [5, 4, 3, 2, 1]

export function emptyDistribution(): RatingDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
}

/** Redondeo a 1 decimal sin errores de coma flotante (4.45 → 4.5). */
export function roundAverage(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 10) / 10
}

export function computeReviewSummary(
  rows: ReadonlyArray<{ rating: number; count: number }>,
): ReviewSummary {
  const distribution = emptyDistribution()
  let count = 0
  let total = 0
  for (const { rating, count: n } of rows) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !(n > 0)) continue
    distribution[rating as RatingValue] += n
    count += n
    total += rating * n
  }
  return { average: count > 0 ? roundAverage(total / count) : 0, count, distribution }
}

/** Porcentaje entero (0-100) de una barra de la distribución. */
export function distributionPercent(value: number, count: number): number {
  if (count <= 0 || value <= 0) return 0
  return Math.round((value / count) * 100)
}

/** "1 opinión" / "12 opiniones". */
export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'opinión' : 'opiniones'}`
}

/**
 * Promedio con 1 decimal y punto (uso en Perú): 4.5 → "4.5", 5 → "5.0".
 * toFixed y no toLocaleString: igual en servidor y navegador (sin desfase al hidratar).
 */
export function formatAverage(average: number): string {
  return roundAverage(average).toFixed(1)
}

/** "1 estrella" / "4 estrellas". */
export function starsLabel(value: number): string {
  return `${value} ${value === 1 ? 'estrella' : 'estrellas'}`
}
