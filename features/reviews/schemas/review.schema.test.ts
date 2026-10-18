import { describe, expect, it } from 'vitest'
import { reviewInputSchema, toPlainText } from './review.schema'

const valid = {
  productId: 'prod_123',
  rating: 5,
  title: 'Excelente acabado',
  body: 'La figura llegó impecable y bien embalada.',
}

describe('toPlainText', () => {
  it('quita etiquetas HTML pero conserva el texto', () => {
    expect(toPlainText('<b>Hola</b> <script>alert(1)</script>mundo')).toBe('Hola alert(1)mundo')
  })

  it('quita caracteres de control y normaliza saltos de línea', () => {
    expect(toPlainText('a\u0000b\r\nc\n\n\n\nd')).toBe('ab\nc\n\nd')
  })

  it('recorta espacios', () => {
    expect(toPlainText('   texto   ')).toBe('texto')
  })
})

describe('reviewInputSchema', () => {
  it('acepta una reseña válida', () => {
    const r = reviewInputSchema.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it.each([0, 6, 3.5, Number.NaN])('rechaza la calificación %s', (rating) => {
    expect(reviewInputSchema.safeParse({ ...valid, rating }).success).toBe(false)
  })

  it('el título es opcional y vacío equivale a ausente', () => {
    const r = reviewInputSchema.safeParse({ ...valid, title: '   ' })
    expect(r.success && r.data.title).toBeUndefined()
    const r2 = reviewInputSchema.safeParse({ ...valid, title: undefined })
    expect(r2.success).toBe(true)
  })

  it('limita el título a 120 caracteres', () => {
    expect(reviewInputSchema.safeParse({ ...valid, title: 'a'.repeat(120) }).success).toBe(true)
    expect(reviewInputSchema.safeParse({ ...valid, title: 'a'.repeat(121) }).success).toBe(false)
  })

  it('exige entre 10 y 2000 caracteres de opinión tras recortar', () => {
    expect(reviewInputSchema.safeParse({ ...valid, body: '   corto    ' }).success).toBe(false)
    expect(reviewInputSchema.safeParse({ ...valid, body: 'a'.repeat(10) }).success).toBe(true)
    expect(reviewInputSchema.safeParse({ ...valid, body: 'a'.repeat(2000) }).success).toBe(true)
    expect(reviewInputSchema.safeParse({ ...valid, body: 'a'.repeat(2001) }).success).toBe(false)
  })

  it('no cuenta las etiquetas HTML para el mínimo', () => {
    expect(reviewInputSchema.safeParse({ ...valid, body: '<p><b>hola</b></p>' }).success).toBe(false)
  })

  it('devuelve el texto saneado', () => {
    const r = reviewInputSchema.parse({ ...valid, body: '<img src=x onerror=alert(1)>Muy buena figura' })
    expect(r.body).toBe('Muy buena figura')
  })
})
