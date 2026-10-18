import { describe, expect, it } from 'vitest'
import {
  isSessionVersionValid,
  SESSION_RECHECK_MS,
  shouldRecheckSession,
  tokenSessionVersion,
} from './session-version'

describe('tokenSessionVersion', () => {
  it('devuelve el sv cuando es un entero válido', () => {
    expect(tokenSessionVersion(0)).toBe(0)
    expect(tokenSessionVersion(7)).toBe(7)
  })

  it('trata un sv ausente como 0 (tokens previos al despliegue)', () => {
    expect(tokenSessionVersion(undefined)).toBe(0)
    expect(tokenSessionVersion(null)).toBe(0)
  })

  it('descarta valores no enteros o negativos', () => {
    expect(tokenSessionVersion('3')).toBe(0)
    expect(tokenSessionVersion(1.5)).toBe(0)
    expect(tokenSessionVersion(-1)).toBe(0)
    expect(tokenSessionVersion(Number.NaN)).toBe(0)
  })
})

describe('isSessionVersionValid', () => {
  it('acepta cuando coincide con la BD', () => {
    expect(isSessionVersionValid(2, 2)).toBe(true)
  })

  it('acepta un token sin sv mientras la BD siga en 0', () => {
    expect(isSessionVersionValid(undefined, 0)).toBe(true)
  })

  it('rechaza un token sin sv tras "Cerrar todas las sesiones"', () => {
    expect(isSessionVersionValid(undefined, 1)).toBe(false)
  })

  it('rechaza cuando la BD avanzó (sesión revocada)', () => {
    expect(isSessionVersionValid(1, 2)).toBe(false)
  })

  it('rechaza un sv mayor que el de la BD (token manipulado)', () => {
    expect(isSessionVersionValid(5, 2)).toBe(false)
  })
})

describe('shouldRecheckSession', () => {
  const now = 1_000_000_000

  it('revalida si nunca se comprobó', () => {
    expect(shouldRecheckSession(undefined, now)).toBe(true)
    expect(shouldRecheckSession('x', now)).toBe(true)
  })

  it('no revalida dentro del intervalo', () => {
    expect(shouldRecheckSession(now - SESSION_RECHECK_MS + 1, now)).toBe(false)
  })

  it('revalida al cumplirse el intervalo', () => {
    expect(shouldRecheckSession(now - SESSION_RECHECK_MS, now)).toBe(true)
  })

  it('revalida si checkedAt está en el futuro', () => {
    expect(shouldRecheckSession(now + 60_000, now)).toBe(true)
  })

  it('respeta un intervalo personalizado', () => {
    expect(shouldRecheckSession(now - 500, now, 1000)).toBe(false)
    expect(shouldRecheckSession(now - 1000, now, 1000)).toBe(true)
  })
})
