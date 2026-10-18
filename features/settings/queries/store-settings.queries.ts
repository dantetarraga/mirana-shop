import { DEFAULT_DEPOSIT_PERCENT } from '@/features/checkout/lib/preorder'
import { BASE_SHIPPING_COST } from '@/features/checkout/lib/pricing'
import type { BannerLayout } from '@/generated/prisma/client'
import { db } from '@/shared/lib/db'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { cache } from 'react'

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
  footerLogoUrl: string
  instagramUrl: string
  tiktokUrl: string
  youtubeUrl: string
  facebookUrl: string
  /** CSV de claves de bloques fijos del inicio que están ocultos */
  hiddenHomeBlocks: string
  /** Datos del proveedor (Libro de Reclamaciones y footer). null = sin configurar */
  legalName: string | null
  ruc: string | null
  fiscalAddress: string | null
}

const DEFAULTS: StoreSettingsData = {
  showOutOfStock: true,
  whatsappNumber: '',
  baseShippingCost: BASE_SHIPPING_COST,
  bannerLayout: 'CARD',
  preorderDepositPercent: DEFAULT_DEPOSIT_PERCENT,
  footerLogoUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  hiddenHomeBlocks: '',
  legalName: null,
  ruc: null,
  fiscalAddress: null,
}

async function fetchStoreSettings(): Promise<StoreSettingsData> {
  const row = await db.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
    select: {
      showOutOfStock: true,
      whatsappNumber: true,
      baseShippingCost: true,
      bannerLayout: true,
      preorderDepositPercent: true,
      footerLogoUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      youtubeUrl: true,
      facebookUrl: true,
      hiddenHomeBlocks: true,
      legalName: true,
      ruc: true,
      fiscalAddress: true,
    },
  })
  return row ? { ...row, baseShippingCost: Number(row.baseShippingCost) } : DEFAULTS
}

/**
 * Se lee ~10 veces por request (layout, footer, home, helpers de abajo):
 * `cache()` las reduce a una sola por request y `unstable_cache` evita ir a la
 * BD entre requests. La forma es serializable (solo primitivos). Guardar los
 * ajustes hace `revalidatePath('/', 'layout')`, que caduca esta entrada por sus
 * tags implícitos de ruta.
 */
export const getStoreSettings = cache(
  cachedQuery(fetchStoreSettings, ['store-settings'], {
    tags: [CACHE_TAGS.settings],
    revalidate: REVALIDATE_LONG,
  }),
)

/**
 * Adelanto por defecto de la preventa parcial. Cada producto puede
 * sobrescribirlo con `Product.preorderDepositPercent`.
 */
export async function getPreorderDepositPercent(): Promise<number> {
  const { preorderDepositPercent } = await getStoreSettings()
  return preorderDepositPercent
}

/**
 * Cómo debe mostrar el inicio todos sus banners: grid de tarjetas, hero a
 * ancho completo con fundido o editorial (texto a la izquierda sobre la foto).
 * Ajuste global de /admin/settings.
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

export type ProviderLegalData = Pick<StoreSettingsData, 'legalName' | 'ruc' | 'fiscalAddress'>

/**
 * Razón social, RUC y domicilio fiscal del proveedor, exigidos en la Hoja de
 * Reclamación (Anexo I del D.S. 011-2011-PCM) y mostrados en el footer.
 */
export async function getProviderLegalData(): Promise<ProviderLegalData> {
  const { legalName, ruc, fiscalAddress } = await getStoreSettings()
  return { legalName, ruc, fiscalAddress }
}
