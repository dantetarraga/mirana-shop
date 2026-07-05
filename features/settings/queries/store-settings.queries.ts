import { BASE_SHIPPING_COST } from '@/features/checkout/lib/pricing'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Configuración general de la tienda — registro único editable en /admin/settings
// ---------------------------------------------------------------------------

export const STORE_SETTINGS_ID = 'store'

export interface StoreSettingsData {
  showOutOfStock: boolean
  whatsappNumber: string
  baseShippingCost: number
}

const DEFAULTS: StoreSettingsData = {
  showOutOfStock: true,
  whatsappNumber: '',
  baseShippingCost: BASE_SHIPPING_COST,
}

export async function getStoreSettings(): Promise<StoreSettingsData> {
  const row = await db.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
    select: { showOutOfStock: true, whatsappNumber: true, baseShippingCost: true },
  })
  return row ? { ...row, baseShippingCost: Number(row.baseShippingCost) } : DEFAULTS
}

/**
 * stockFilter a aplicar en los listados públicos del storefront:
 * 'in' (solo con stock) cuando el admin ocultó los productos agotados.
 */
export async function getPublicStockFilter(): Promise<'in' | undefined> {
  const { showOutOfStock } = await getStoreSettings()
  return showOutOfStock ? undefined : 'in'
}

/**
 * Número de WhatsApp de la tienda (E.164 sin "+", ej: "51987654321").
 * Prioridad: configuración del admin → variable de entorno (fallback legacy).
 */
export async function getWhatsappPhone(): Promise<string> {
  const { whatsappNumber } = await getStoreSettings()
  return whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || ''
}
