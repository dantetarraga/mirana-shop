import { describe, expect, it } from 'vitest'
import { createComplaintSchema, docNumberError } from './complaint.schema'

const base = {
  fullName: 'Juan García',
  docType: 'DNI' as const,
  docNumber: '12345678',
  address: 'Av. Principal 123',
  phone: '+51 999 999 999',
  email: 'Juan@Correo.com',
  isMinor: false,
  goodType: 'PRODUCTO' as const,
  productDescription: 'Figura de colección',
  type: 'RECLAMO' as const,
  detail: 'Llegó con la caja rota',
  request: 'Cambio del producto',
  truthDeclarationAccepted: true,
  privacyAccepted: true,
}

const paths = (input: unknown) => {
  const r = createComplaintSchema.safeParse(input)
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
}

describe('docNumberError', () => {
  it('valida por tipo de documento', () => {
    expect(docNumberError('DNI', '12345678')).toBeNull()
    expect(docNumberError('DNI', '1234567')).not.toBeNull()
    expect(docNumberError('CE', '001234567')).toBeNull()
    expect(docNumberError('CE', '12345678')).not.toBeNull()
    expect(docNumberError('PASAPORTE', 'AB12345')).toBeNull()
    expect(docNumberError('PASAPORTE', 'AB-1')).not.toBeNull()
  })
})

describe('createComplaintSchema', () => {
  it('acepta una hoja válida y normaliza el correo', () => {
    const r = createComplaintSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('juan@correo.com')
  })

  it('exige declaración de veracidad y consentimiento de datos', () => {
    expect(paths({ ...base, truthDeclarationAccepted: false, privacyAccepted: false })).toEqual(
      expect.arrayContaining(['truthDeclarationAccepted', 'privacyAccepted']),
    )
  })

  it('exige datos del apoderado si es menor de edad', () => {
    expect(paths({ ...base, isMinor: true })).toEqual(
      expect.arrayContaining(['guardianName', 'guardianDocType']),
    )
    expect(
      paths({ ...base, isMinor: true, guardianName: 'Ana García', guardianDocType: 'DNI', guardianDocNumber: '123' }),
    ).toEqual(['guardianDocNumber'])
  })

  it('valida teléfono y tope del monto', () => {
    expect(paths({ ...base, phone: '12ab' })).toEqual(['phone'])
    expect(paths({ ...base, claimedAmount: '2000000' })).toEqual(['claimedAmount'])
    expect(paths({ ...base, claimedAmount: '150.50' })).toEqual([])
  })
})
