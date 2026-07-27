'use server'

import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Secciones del inicio — CRUD del admin + sincronización desde la ficha de
// producto (el mismo patrón que `syncProductCollections`).
// ---------------------------------------------------------------------------

const sectionSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(80),
  eyebrow: z.string().max(60).optional().default(''),
  // Lo arma el LinkPicker: ruta interna o URL absoluta. Vacío = /catalogo.
  ctaHref: z
    .union([z.string().url('URL inválida'), z.string().startsWith('/'), z.literal('')])
    .optional()
    .default(''),
  position: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

export type HomeSectionInput = z.infer<typeof sectionSchema>

function invalidateSectionCaches() {
  revalidatePath('/admin/sections')
  revalidatePath('/')
  revalidateTag('products', 'max')
}

export async function saveHomeSection(
  id: string | null,
  rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = sectionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  try {
    if (id) {
      const updated = await db.homeSection.update({
        where: { id },
        data: parsed.data,
        select: { id: true },
      })
      invalidateSectionCaches()
      return { success: true, data: { id: updated.id } }
    }

    const created = await db.homeSection.create({
      data: parsed.data,
      select: { id: true },
    })
    invalidateSectionCaches()
    return { success: true, data: { id: created.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar la sección'
    return { success: false, error: message, code: 500 }
  }
}

/**
 * Borrado definitivo: una sección no guarda contenido propio —solo la cabecera
 * y qué productos enlaza—, así que no entra en la papelera. Los productos no se
 * tocan; solo desaparece el enlace (cascade sobre ProductHomeSection).
 */
export async function deleteHomeSection(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  try {
    await db.homeSection.delete({ where: { id } })
    invalidateSectionCaches()
    revalidatePath('/admin/products')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar la sección'
    return { success: false, error: message, code: 500 }
  }
}

/** Mostrar/ocultar en el inicio sin abrir el formulario */
export async function toggleHomeSection(id: string, active: boolean): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  try {
    await db.homeSection.update({ where: { id }, data: { active: !active } })
    invalidateSectionCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cambiar la visibilidad'
    return { success: false, error: message, code: 500 }
  }
}

/** Diff y aplica las secciones de un producto en una sola llamada */
export async function syncProductHomeSections(
  productId: string,
  desiredIds: string[],
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!productId) return { success: false, error: 'ID de producto requerido', code: 400 }

  try {
    const current = await db.productHomeSection.findMany({
      where: { productId },
      select: { sectionId: true },
    })
    const currentIds = new Set(current.map((r) => r.sectionId))
    const desiredSet = new Set(desiredIds)

    const toAdd = desiredIds.filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !desiredSet.has(id))

    await Promise.all([
      ...toAdd.map((sectionId) =>
        db.productHomeSection.upsert({
          where: { productId_sectionId: { productId, sectionId } },
          create: { productId, sectionId },
          update: {},
        }),
      ),
      ...toRemove.map((sectionId) =>
        db.productHomeSection.deleteMany({ where: { productId, sectionId } }),
      ),
    ])

    revalidatePath('/admin/products')
    invalidateSectionCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al sincronizar las secciones'
    return { success: false, error: message, code: 500 }
  }
}
