import 'server-only'
import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'

/** Compara correlativos como números, incluso después de MIR-YYYY-9999. */
export async function nextOrderCode(tx: TransactionClient, year: number): Promise<string> {
  const prefix = `MIR-${year}-`
  const [result] = await tx.$queryRaw<{ maxNumber: bigint | number | string | null }[]>`
    SELECT MAX(CAST(SUBSTRING_INDEX(code, '-', -1) AS UNSIGNED)) AS maxNumber
    FROM \`Order\`
    WHERE code LIKE ${`${prefix}%`}
  `
  const next = BigInt(result?.maxNumber ?? 0) + 1n
  return `${prefix}${String(next).padStart(4, '0')}`
}
