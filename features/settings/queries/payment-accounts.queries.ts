import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Métodos de pago manuales (Yape, BCP, BBVA, etc.) mostrados en el checkout.
// Yape/Plin solo llevan número; cuentas bancarias llevan número y CCI.
// ---------------------------------------------------------------------------

export interface PaymentAccountData {
  id: string
  name: string
  holder: string
  number: string
  cci: string
  active: boolean
}

const SELECT = {
  id: true,
  name: true,
  holder: true,
  number: true,
  cci: true,
  active: true,
} as const

/** Solo cuentas activas — para el checkout */
export async function getActivePaymentAccounts(): Promise<PaymentAccountData[]> {
  return db.paymentAccount.findMany({
    where: { active: true },
    select: SELECT,
    orderBy: { position: 'asc' },
  })
}

/** Todas las cuentas — para el admin */
export async function getAllPaymentAccounts(): Promise<PaymentAccountData[]> {
  return db.paymentAccount.findMany({
    select: SELECT,
    orderBy: { position: 'asc' },
  })
}
