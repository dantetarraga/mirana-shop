// La tienda opera en Lima (UTC-5): ahí es donde se corría el mes.
process.env.TZ = 'America/Lima'

import { describe, expect, it } from 'vitest'
import { formatEstimatedArrival } from './estimated-arrival'

describe('formatEstimatedArrival', () => {
  it('no corre el mes de una fecha civil guardada a medianoche UTC', () => {
    // Lo que guarda el formulario del admin para "2026-11-01".
    expect(formatEstimatedArrival(new Date('2026-11-01'))).toBe('noviembre de 2026')
    expect(formatEstimatedArrival('2026-11-01T00:00:00.000Z')).toBe('noviembre de 2026')
  })

  it('respeta el último día del mes', () => {
    expect(formatEstimatedArrival(new Date('2026-12-31'))).toBe('diciembre de 2026')
  })

  it('sin fecha → por confirmar', () => {
    expect(formatEstimatedArrival(null)).toBe('Fecha por confirmar')
  })
})
