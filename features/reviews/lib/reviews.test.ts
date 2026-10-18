import { describe, expect, it } from 'vitest'
import { ANONYMOUS_AUTHOR, formatAuthorName } from './author-name'
import { aggregateRatingJsonLd, reviewJsonLd } from './review-jsonld'
import {
  computeReviewSummary,
  distributionPercent,
  formatAverage,
  reviewCountLabel,
  roundAverage,
} from './review-summary'

describe('formatAuthorName', () => {
  it('nombre + inicial del último apellido', () => {
    expect(formatAuthorName('Carlos Mendoza')).toBe('Carlos M.')
    expect(formatAuthorName('maría josé quispe huamán')).toBe('María H.')
  })

  it('un solo nombre se muestra tal cual, capitalizado', () => {
    expect(formatAuthorName('lucía')).toBe('Lucía')
  })

  it('normaliza espacios y mayúsculas', () => {
    expect(formatAuthorName('   JORGE    ÁLVAREZ  ')).toBe('Jorge Á.')
  })

  it('nunca expone un correo', () => {
    expect(formatAuthorName('cliente@example.com')).toBe(ANONYMOUS_AUTHOR)
    expect(formatAuthorName('Ana ana.torres@gmail.com')).toBe('Ana')
  })

  it('sin nombre usa el genérico', () => {
    expect(formatAuthorName(null)).toBe(ANONYMOUS_AUTHOR)
    expect(formatAuthorName('')).toBe(ANONYMOUS_AUTHOR)
    expect(formatAuthorName('123 !!!')).toBe(ANONYMOUS_AUTHOR)
  })
})

describe('computeReviewSummary', () => {
  it('sin reseñas', () => {
    expect(computeReviewSummary([])).toEqual({
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    })
  })

  it('promedio con 1 decimal y distribución', () => {
    const s = computeReviewSummary([
      { rating: 5, count: 3 },
      { rating: 4, count: 1 },
      { rating: 2, count: 1 },
    ])
    // (15 + 4 + 2) / 5 = 4.2
    expect(s.average).toBe(4.2)
    expect(s.count).toBe(5)
    expect(s.distribution).toEqual({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 3 })
  })

  it('redondea hacia arriba en .x5', () => {
    // (5*9 + 4*11) / 20 = 4.45 → 4.5
    expect(computeReviewSummary([{ rating: 5, count: 9 }, { rating: 4, count: 11 }]).average).toBe(4.5)
    expect(roundAverage(4.449)).toBe(4.4)
  })

  it('ignora filas fuera de rango', () => {
    const s = computeReviewSummary([
      { rating: 0, count: 4 },
      { rating: 6, count: 1 },
      { rating: 3, count: 2 },
      { rating: 4, count: 0 },
    ])
    expect(s).toEqual({ average: 3, count: 2, distribution: { 1: 0, 2: 0, 3: 2, 4: 0, 5: 0 } })
  })
})

describe('helpers de presentación', () => {
  it('distributionPercent', () => {
    expect(distributionPercent(1, 3)).toBe(33)
    expect(distributionPercent(0, 3)).toBe(0)
    expect(distributionPercent(2, 0)).toBe(0)
  })

  it('reviewCountLabel', () => {
    expect(reviewCountLabel(1)).toBe('1 opinión')
    expect(reviewCountLabel(12)).toBe('12 opiniones')
  })

  it('formatAverage siempre con 1 decimal', () => {
    expect(formatAverage(4.5)).toBe('4.5')
    expect(formatAverage(5)).toBe('5.0')
  })
})

describe('JSON-LD', () => {
  it('sin reseñas no hay AggregateRating', () => {
    expect(aggregateRatingJsonLd({ average: 0, count: 0 })).toBeUndefined()
    expect(aggregateRatingJsonLd(null)).toBeUndefined()
  })

  it('AggregateRating', () => {
    expect(aggregateRatingJsonLd({ average: 4.6, count: 12 })).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.6,
      reviewCount: 12,
      bestRating: 5,
      worstRating: 1,
    })
  })

  it('Review', () => {
    const ld = reviewJsonLd({
      authorName: 'Carlos M.',
      rating: 5,
      title: null,
      body: 'Excelente',
      createdAt: '2026-10-01T15:00:00.000Z',
    })
    expect(ld).toEqual({
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Carlos M.' },
      datePublished: '2026-10-01',
      reviewBody: 'Excelente',
      reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 },
    })
  })
})
