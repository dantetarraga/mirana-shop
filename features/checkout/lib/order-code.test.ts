import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'
import { nextOrderCode } from './order-code'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

describe('correlativo de pedidos', () => {
  it.each([
    [null, '0001'],
    [9, '0010'],
    [9999n, '10000'],
    ['10000', '10001'],
  ])('continúa el máximo numérico %s', async (maxNumber, suffix) => {
    const query = vi.fn().mockResolvedValue([{ maxNumber }])
    const tx = { $queryRaw: query } as unknown as TransactionClient
    expect(await nextOrderCode(tx, 2026)).toBe(`MIR-2026-${suffix}`)
    const [sql, prefix] = query.mock.calls[0]
    expect(sql.join('?')).toContain("MAX(CAST(SUBSTRING_INDEX(code, '-', -1) AS UNSIGNED))")
    expect(prefix).toBe('MIR-2026-%')
  })
})
