import { describe, expect, it } from 'vitest'
import {
  addBusinessDays,
  complaintDueStatus,
  computeComplaintDueAt,
  easterSunday,
  formatComplaintCode,
  isBusinessDay,
  isPeruNationalHoliday,
  limaCivilDate,
  limaYear,
} from './business-days'

describe('easterSunday', () => {
  it('calcula la Pascua de varios años', () => {
    expect(easterSunday(2024)).toEqual({ year: 2024, month: 3, day: 31 })
    expect(easterSunday(2025)).toEqual({ year: 2025, month: 4, day: 20 })
    expect(easterSunday(2026)).toEqual({ year: 2026, month: 4, day: 5 })
    expect(easterSunday(2027)).toEqual({ year: 2027, month: 3, day: 28 })
  })
})

describe('feriados y días hábiles', () => {
  it('reconoce feriados fijos y Semana Santa', () => {
    expect(isPeruNationalHoliday({ year: 2026, month: 7, day: 28 })).toBe(true)
    expect(isPeruNationalHoliday({ year: 2026, month: 6, day: 7 })).toBe(true)
    expect(isPeruNationalHoliday({ year: 2026, month: 4, day: 2 })).toBe(true) // Jueves Santo
    expect(isPeruNationalHoliday({ year: 2026, month: 4, day: 3 })).toBe(true) // Viernes Santo
    expect(isPeruNationalHoliday({ year: 2026, month: 4, day: 6 })).toBe(false)
  })

  it('excluye sábados, domingos y feriados', () => {
    expect(isBusinessDay({ year: 2026, month: 10, day: 17 })).toBe(false) // sábado
    expect(isBusinessDay({ year: 2026, month: 10, day: 18 })).toBe(false) // domingo
    expect(isBusinessDay({ year: 2026, month: 10, day: 8 })).toBe(false) // Angamos (jueves)
    expect(isBusinessDay({ year: 2026, month: 10, day: 19 })).toBe(true)
  })

  it('cruza el fin de año saltando Navidad y Año Nuevo', () => {
    expect(addBusinessDays({ year: 2025, month: 12, day: 22 }, 15)).toEqual({
      year: 2026,
      month: 1,
      day: 14,
    })
  })
})

describe('computeComplaintDueAt', () => {
  it('cuenta 15 días hábiles desde el día siguiente y vence al final del día en Lima', () => {
    // Sábado 17/10/2026 → viernes 06/11/2026 23:59:59.999 Lima
    expect(computeComplaintDueAt(new Date('2026-10-17T15:00:00Z')).toISOString()).toBe(
      '2026-11-07T04:59:59.999Z',
    )
  })

  it('salta Fiestas Patrias, Fuerza Aérea y Junín', () => {
    // Lunes 20/07/2026 → viernes 14/08/2026
    expect(computeComplaintDueAt(new Date('2026-07-20T15:00:00Z')).toISOString()).toBe(
      '2026-08-15T04:59:59.999Z',
    )
  })

  it('salta Jueves y Viernes Santo', () => {
    // Lunes 30/03/2026 → miércoles 22/04/2026
    expect(computeComplaintDueAt(new Date('2026-03-30T15:00:00Z')).toISOString()).toBe(
      '2026-04-23T04:59:59.999Z',
    )
  })

  it('usa el día civil de Lima, no el de UTC', () => {
    // 2026-10-20 03:00 UTC = lunes 19/10 22:00 en Lima
    expect(limaCivilDate(new Date('2026-10-20T03:00:00Z'))).toEqual({
      year: 2026,
      month: 10,
      day: 19,
    })
    expect(computeComplaintDueAt(new Date('2026-10-20T03:00:00Z')).toISOString()).toBe(
      '2026-11-10T04:59:59.999Z',
    )
  })
})

describe('correlativo', () => {
  it('toma el año en America/Lima', () => {
    expect(limaYear(new Date('2026-01-01T03:00:00Z'))).toBe(2025)
    expect(limaYear(new Date('2026-01-01T06:00:00Z'))).toBe(2026)
  })

  it('formatea con ceros a la izquierda y no se trunca al superar el padding', () => {
    expect(formatComplaintCode(2026, 7)).toBe('LR-2026-000007')
    expect(formatComplaintCode(2026, 1_234_567)).toBe('LR-2026-1234567')
  })
})

describe('complaintDueStatus', () => {
  const due = new Date('2026-11-07T04:59:59.999Z')
  it('clasifica el semáforo', () => {
    expect(complaintDueStatus(due, true, new Date('2026-12-01T00:00:00Z'))).toBe('answered')
    expect(complaintDueStatus(due, false, new Date('2026-11-08T00:00:00Z'))).toBe('overdue')
    expect(complaintDueStatus(due, false, new Date('2026-11-05T00:00:00Z'))).toBe('due-soon')
    expect(complaintDueStatus(due, false, new Date('2026-10-20T00:00:00Z'))).toBe('on-time')
  })
})
