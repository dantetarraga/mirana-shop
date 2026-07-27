import { BASE_SHIPPING_COST } from '@/features/checkout/lib/pricing'
import { DEFAULT_DEPOSIT_PERCENT } from '@/features/checkout/lib/preorder'
import type { BannerLayout } from '@/generated/prisma/client'
import { db } from '@/shared/lib/db'

export type { BannerLayout }

// ---------------------------------------------------------------------------
// Configuración general de la tienda — registro único editable en /admin/settings
// ---------------------------------------------------------------------------

export const STORE_SETTINGS_ID = 'store'

export interface StoreSettingsData {
  showOutOfStock: boolean
  whatsappNumber: string
  baseShippingCost: number
  bannerLayout: BannerLayout
  preorderDepositPercent: number
}

const DEFAULTS: StoreSettingsData = {
  showOutOfStock: true,
  whatsappNumber: '',
  baseShippingCost: BASE_SHIPPING_COST,
  bannerLayout: 'CARD',
  preorderDepositPercent: DEFAULT_DEPOSIT_PERCENT,
}

export async function getStoreSettings(): Promise<StoreSettingsData> {
  const row = await db.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
    select: {
      showOutOfStock: true,
      whatsappNumber: true,
      baseShippingCost: true,
      bannerLayout: true,
      preorderDepositPercent: true,
    },
  })
  return row ? { ...row, baseShippingCost: Number(row.baseShippingCost) } : DEFAULTS
}

/**
 * Adelanto por defecto de la preventa parcial. Cada producto puede
 * sobrescribirlo con `Product.preorderDepositPercent`.
 */
export async function getPreorderDepositPercent(): Promise<number> {
  const { preorderDepositPercent } = await getStoreSettings()
  return preorderDepositPercent
}

/**
 * Cómo debe mostrar el inicio todos sus banners: grid de tarjetas o hero a
 * ancho completo con fundido. Ajuste global de /admin/settings.
 */
export async function getBannerLayout(): Promise<BannerLayout> {
  const { bannerLayout } = await getStoreSettings()
  return bannerLayout
}

/**
 * ¿Los listados públicos deben ocultar lo agotado? Refleja el ajuste
 * "Mostrar productos sin stock" de /admin/settings, invertido.
 */
export async function getHideOutOfStock(): Promise<boolean> {
  const { showOutOfStock } = await getStoreSettings()
  return !showOutOfStock
}

/**
 * Número de WhatsApp de la tienda (E.164 sin "+", ej: "51987654321").
 * Prioridad: configuración del admin → variable de entorno (fallback legacy).
 */
export async function getWhatsappPhone(): Promise<string> {
  const { whatsappNumber } = await getStoreSettings()
  return whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || ''
}
