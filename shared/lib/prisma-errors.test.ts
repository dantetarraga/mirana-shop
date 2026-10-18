import { describe, expect, it } from 'vitest'
import { prismaErrorCode, prismaErrorMessage, prismaFailure } from './prisma-errors'

const messages = {
  unique: 'Ya existe',
  foreignKey: 'Referencia inválida',
  notFound: 'No encontrada',
  fallback: 'Error al guardar',
}

describe('prismaErrorMessage', () => {
  it('traduce los códigos conocidos', () => {
    expect(prismaErrorMessage({ code: 'P2002' }, messages)).toBe('Ya existe')
    expect(prismaErrorMessage({ code: 'P2003' }, messages)).toBe('Referencia inválida')
    expect(prismaErrorMessage({ code: 'P2025' }, messages)).toBe('No encontrada')
  })

  it('nunca devuelve el mensaje crudo', () => {
    const raw = Object.assign(new Error('Unique constraint failed on `Category_name_key`'), {
      code: 'P2010',
    })
    expect(prismaErrorMessage(raw, messages)).toBe('Error al guardar')
    expect(prismaErrorMessage(new Error('boom'), messages)).toBe('Error al guardar')
  })

  it('usa el fallback si falta el mensaje específico', () => {
    expect(prismaErrorMessage({ code: 'P2002' }, { fallback: 'X' })).toBe('X')
  })

  it('ignora códigos que no son de Prisma', () => {
    expect(prismaErrorCode({ code: 'ECONNREFUSED' })).toBeNull()
    expect(prismaErrorCode(null)).toBeNull()
  })

  it('prismaFailure arma el ActionResult con el código HTTP', () => {
    expect(prismaFailure({ code: 'P2002' }, messages)).toEqual({
      success: false,
      error: 'Ya existe',
      code: 409,
    })
    expect(prismaFailure(new Error('x'), messages).code).toBe(500)
  })
})
