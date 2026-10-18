import { describe, expect, it } from 'vitest'
import { slugify, SLUG_PATTERN, uniqueSlug } from './slug'

describe('slugify', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(slugify('Figuras de Acción')).toBe('figuras-de-accion')
    expect(slugify('Muñecos Ñoños')).toBe('munecos-nonos')
  })

  it('colapsa símbolos y espacios en un solo guion', () => {
    expect(slugify('Anime & Manga')).toBe('anime-manga')
    expect(slugify('  LEGO  —  Star Wars!! ')).toBe('lego-star-wars')
  })

  it('conserva números y guiones existentes', () => {
    expect(slugify('LEGO Technic 42151')).toBe('lego-technic-42151')
    expect(slugify('figuras-accion')).toBe('figuras-accion')
  })

  it('siempre cumple el patrón de las actions (o queda vacío)', () => {
    for (const s of ['¡Hola!', 'Ü-ber', 'a__b', '1/12 Scale', '---']) {
      const slug = slugify(s)
      expect(slug === '' || SLUG_PATTERN.test(slug)).toBe(true)
      expect(slug.startsWith('-') || slug.endsWith('-')).toBe(false)
    }
  })

  it('es idempotente: un slug guardado no cambia al volver a pasarlo', () => {
    for (const stored of ['anime', 'modelos-escala', 'lego-star-wars-75375']) {
      expect(slugify(stored)).toBe(stored)
    }
  })
})

describe('uniqueSlug', () => {
  it('agrega sufijo cuando está tomado y lo registra', () => {
    const taken = new Set(['marvel'])
    expect(uniqueSlug('Marvel', taken)).toBe('marvel-2')
    expect(uniqueSlug('Marvel', taken)).toBe('marvel-3')
    expect(taken.has('marvel-3')).toBe(true)
  })

  it('usa el fallback si el nombre no deja caracteres válidos', () => {
    expect(uniqueSlug('!!!', new Set())).toBe('item')
  })
})
