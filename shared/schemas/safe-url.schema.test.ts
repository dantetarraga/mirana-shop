import { httpUrlSchema, safeHref, safeHrefSchema } from '@/shared/schemas/safe-url.schema'
import { describe, expect, it } from 'vitest'

describe('safe URL schemas', () => {
  it('accepts internal paths and http(s) links', () => {
    expect(safeHrefSchema().safeParse('/catalogo?oferta=1').success).toBe(true)
    expect(httpUrlSchema().safeParse('https://www.instagram.com/mirana').success).toBe(true)
  })

  it('rejects executable and protocol-relative destinations', () => {
    expect(safeHrefSchema().safeParse('javascript:alert(1)').success).toBe(false)
    expect(safeHrefSchema().safeParse('//evil.example/path').success).toBe(false)
    expect(safeHref('data:text/html,test', '/catalogo')).toBe('/catalogo')
  })
})
