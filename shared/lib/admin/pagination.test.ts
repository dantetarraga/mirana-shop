import { parsePage } from '@/shared/lib/admin/pagination'
import { describe, expect, it } from 'vitest'

describe('parsePage', () => {
  it('acepta enteros positivos', () => {
    expect(parsePage('1')).toBe(1)
    expect(parsePage('7')).toBe(7)
    expect(parsePage(' 3 ')).toBe(3)
    expect(parsePage(4)).toBe(4)
  })

  it('usa el primer valor cuando el parámetro se repite', () => {
    expect(parsePage(['5', '9'])).toBe(5)
    expect(parsePage([])).toBe(1)
  })

  it('cae a la página 1 ante valores inválidos', () => {
    for (const raw of [
      undefined,
      null,
      '',
      '   ',
      'abc',
      '0',
      '-2',
      '2.5',
      'NaN',
      'Infinity',
      '1e999',
      '1e20',
      {},
      true,
    ]) {
      expect(parsePage(raw)).toBe(1)
    }
  })
})
