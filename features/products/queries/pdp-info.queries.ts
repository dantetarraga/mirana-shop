import 'server-only'
import { cachedQuery, CACHE_TAGS, REVALIDATE_SHORT } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'

// ---------------------------------------------------------------------------
// Datos de los acordeones de la ficha ("Métodos de pago").
//
// Solo los NOMBRES de las cuentas activas (BCP, Yape…): la ficha es pública y
// cacheada, y los números de cuenta y CCI se muestran recién en el checkout.
// Se cachea entre requests con REVALIDATE_SHORT: las actions de cuentas de pago
// solo revalidan /checkout y /admin/settings, así que un cambio de banco tarda
// como mucho 5 minutos en verse en las fichas.
// ---------------------------------------------------------------------------

async function fetchPaymentMethodNames(): Promise<string[]> {
  const rows = await db.paymentAccount.findMany({
    where: { active: true },
    select: { name: true },
    orderBy: { position: 'asc' },
  })
  // Dos cuentas del mismo banco (soles y dólares) se nombran una sola vez.
  return [...new Set(rows.map((r) => r.name.trim()).filter(Boolean))]
}

/** Nombres de las cuentas de pago activas, en el orden del admin. */
export const getPaymentMethodNames = cache(
  cachedQuery(fetchPaymentMethodNames, ['pdp-payment-method-names'], {
    tags: [CACHE_TAGS.settings],
    revalidate: REVALIDATE_SHORT,
  }),
)
