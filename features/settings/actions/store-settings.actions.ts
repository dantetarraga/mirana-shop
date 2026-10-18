'use server'

import { DEFAULT_DEPOSIT_PERCENT } from '@/features/checkout/lib/preorder'
import { STORE_SETTINGS_ID } from '@/features/settings/queries/store-settings.queries'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { httpUrlSchema } from '@/shared/schemas/safe-url.schema'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/** Texto opcional: vacío se guarda como null ("sin configurar"). */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .nullish()
    .transform((v) => (v ? v : null))

const storeSettingsSchema = z.object({
  showOutOfStock: z.boolean(),
  whatsappNumber: z
    .string()
    .regex(/^\d*$/, 'Solo dígitos, con código de país (ej: 51987654321)')
    .max(15, 'Número demasiado largo'),
  baseShippingCost: z.number().min(0, 'Debe ser mayor o igual a 0'),
  bannerLayout: z.enum(['CARD', 'FULLSCREEN', 'EDITORIAL']).optional().default('CARD'),
  preorderDepositPercent: z
    .number()
    .int()
    .min(1, 'Mínimo 1%')
    .max(100, 'Máximo 100%')
    .optional()
    .default(DEFAULT_DEPOSIT_PERCENT),
  footerLogoUrl: z.union([imageUrlSchema(), z.literal('')]).optional().default(''),
  instagramUrl: httpUrlSchema().optional().default(''),
  tiktokUrl: httpUrlSchema().optional().default(''),
  youtubeUrl: httpUrlSchema().optional().default(''),
  facebookUrl: httpUrlSchema().optional().default(''),
  hiddenHomeBlocks: z.string().optional().default(''),
  // Datos del proveedor para el Libro de Reclamaciones y el footer
  legalName: optionalText(191),
  ruc: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^(10|15|17|20)\d{9}$/.test(v), 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20'),
  fiscalAddress: optionalText(300),
})

export async function saveStoreSettings(rawInput: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = storeSettingsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  try {
    await db.storeSettings.upsert({
      where: { id: STORE_SETTINGS_ID },
      update: parsed.data,
      create: { id: STORE_SETTINGS_ID, ...parsed.data },
    })

    revalidatePath('/')
    revalidatePath('/catalogo')
    revalidatePath('/checkout')
    revalidatePath('/admin/settings')
    // El footer (todas las páginas) y el libro muestran los datos del proveedor
    revalidatePath('/', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[saveStoreSettings]', err)
    return { success: false, error: 'Error al guardar la configuración', code: 500 }
  }
}
