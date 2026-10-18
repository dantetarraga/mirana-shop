'use server'

import { findBrandById } from '@/features/brands/queries/brand.queries'
import { findDrawerProducts } from '@/features/products/queries/drawer-product.queries'
import { trashedConflictError } from '@/features/trash/lib/trashed-conflict'
import { db } from '@/shared/lib/db'
import { prismaErrorMessage, prismaFailure } from '@/shared/lib/prisma-errors'
import { requireAdmin } from '@/shared/lib/require-admin'
import { slugify, SLUG_PATTERN, uniqueSlug } from '@/shared/lib/slug'
import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .min(1, 'Slug requerido')
  .regex(SLUG_PATTERN, 'Solo minúsculas, números y guiones')

const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  slug: slugSchema,
  tagline: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: imageUrlSchema().optional().or(z.literal('')),
  heroUrl: imageUrlSchema().optional().or(z.literal('')),
  isVisible: z.boolean().optional(),
  featured: z.boolean().optional(),
})

const updateBrandSchema = createBrandSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

const flagsSchema = z
  .object({
    id: z.string().min(1, 'ID requerido'),
    isVisible: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine((v) => v.isVisible !== undefined || v.featured !== undefined, 'Nada que cambiar')

const reorderSchema = z
  .array(z.string().min(1))
  .min(1, 'Nada que reordenar')
  .max(2000, 'Demasiadas marcas a la vez')

const SAVE_ERRORS = {
  unique: 'Ya existe una marca con ese nombre o slug',
  notFound: 'Marca no encontrada',
}

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateBrandCaches() {
  revalidatePath('/admin/brands')
  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidateTag('brands', 'max')
  revalidateTag('catalog', 'max')
  // Las tarjetas de producto muestran el nombre de la marca.
  revalidateTag('products', 'max')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Nombre o slug ocupado (viva o en la papelera) por otra marca → mensaje. */
async function findBrandConflict(
  fields: { name?: string; slug?: string },
  excludeId?: string,
): Promise<string | null> {
  const or = [
    ...(fields.name ? [{ name: fields.name }] : []),
    ...(fields.slug ? [{ slug: fields.slug }] : []),
  ]
  if (or.length === 0) return null
  const row = await db.brand.findFirst({
    where: { OR: or, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { name: true, slug: true, deletedAt: true },
  })
  if (!row) return null
  if (row.deletedAt) return trashedConflictError(row.name)
  return row.slug === fields.slug
    ? 'Ya existe una marca con ese slug'
    : `Ya existe una marca llamada "${row.name}"`
}

async function nextBrandPosition(): Promise<number> {
  const last = await db.brand.aggregate({ where: { deletedAt: null }, _max: { position: true } })
  return (last._max.position ?? -1) + 1
}

// ---------------------------------------------------------------------------
// createBrand
// ---------------------------------------------------------------------------

export async function createBrand(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = createBrandSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const { name, slug, tagline, description, imageUrl, heroUrl, isVisible, featured } = parsed.data

  try {
    const conflict = await findBrandConflict({ name, slug })
    if (conflict) return { success: false, error: conflict, code: 409 }

    const created = await db.brand.create({
      data: {
        name,
        slug,
        tagline: tagline || null,
        description: description || null,
        imageUrl: imageUrl || null,
        heroUrl: heroUrl || null,
        isVisible: isVisible ?? true,
        featured: featured ?? false,
        position: await nextBrandPosition(),
      },
      select: { id: true },
    })

    invalidateBrandCaches()
    return { success: true, data: { id: created.id } }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo crear la marca' })
  }
}

// ---------------------------------------------------------------------------
// updateBrand
// ---------------------------------------------------------------------------

export async function updateBrand(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = updateBrandSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const { id, ...fields } = parsed.data

  try {
    const current = await findBrandById(id)
    if (!current) return { success: false, error: 'Marca no encontrada', code: 404 }

    const conflict = await findBrandConflict({ name: fields.name, slug: fields.slug }, id)
    if (conflict) return { success: false, error: conflict, code: 409 }

    const updated = await db.brand.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.tagline !== undefined && { tagline: fields.tagline || null }),
        ...(fields.description !== undefined && { description: fields.description || null }),
        ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl || null }),
        ...(fields.heroUrl !== undefined && { heroUrl: fields.heroUrl || null }),
        ...(fields.isVisible !== undefined && { isVisible: fields.isVisible }),
        ...(fields.featured !== undefined && { featured: fields.featured }),
      },
      select: { id: true },
    })

    invalidateBrandCaches()
    return { success: true, data: { id: updated.id } }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo actualizar la marca' })
  }
}

// ---------------------------------------------------------------------------
// setBrandFlags — switches inline de la lista (Visible / Destacada)
// ---------------------------------------------------------------------------

export async function setBrandFlags(rawInput: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = flagsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const { id, isVisible, featured } = parsed.data

  try {
    const result = await db.brand.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(isVisible !== undefined && { isVisible }),
        ...(featured !== undefined && { featured }),
      },
    })
    if (result.count === 0) return { success: false, error: 'Marca no encontrada', code: 404 }

    invalidateBrandCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo actualizar la marca' })
  }
}

// ---------------------------------------------------------------------------
// reorderBrands — recibe los ids en el nuevo orden (lista completa o parcial;
// las que no vengan conservan su posición relativa al final).
// ---------------------------------------------------------------------------

export async function reorderBrands(rawIds: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = reorderSchema.safeParse(rawIds)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }
  const ids = parsed.data
  if (new Set(ids).size !== ids.length) {
    return { success: false, error: 'Una marca aparece dos veces', code: 400 }
  }

  try {
    const live = await db.brand.findMany({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    })
    const liveIds = new Set(live.map((b) => b.id))
    if (ids.some((id) => !liveIds.has(id))) {
      return {
        success: false,
        error: 'Una de las marcas ya no existe o está en la papelera. Recarga la página.',
        code: 409,
      }
    }

    const sent = new Set(ids)
    const order = [...ids, ...live.map((b) => b.id).filter((id) => !sent.has(id))]

    await db.$transaction(
      order.map((id, position) => db.brand.update({ where: { id }, data: { position } })),
    )

    invalidateBrandCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo guardar el nuevo orden' })
  }
}

// ---------------------------------------------------------------------------
// getBrandProducts
// ---------------------------------------------------------------------------

export async function getBrandProducts(brandId: string): Promise<ActionResult<DrawerProduct[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    return { success: true, data: await findDrawerProducts({ where: { brandId } }) }
  } catch {
    return { success: false, error: 'Error al cargar productos', code: 500 }
  }
}

// ---------------------------------------------------------------------------
// reassignProductBrand
// ---------------------------------------------------------------------------

export async function reassignProductBrand(
  productId: string,
  newBrandId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!productId || !newBrandId) {
    return { success: false, error: 'IDs de producto y marca requeridos', code: 400 }
  }

  try {
    const [product, brand] = await Promise.all([
      db.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true } }),
      db.brand.findFirst({ where: { id: newBrandId }, select: { name: true, deletedAt: true } }),
    ])
    if (!product) return { success: false, error: 'Producto no encontrado', code: 404 }
    if (!brand) return { success: false, error: 'La marca de destino no existe', code: 404 }
    if (brand.deletedAt) {
      return {
        success: false,
        error: `"${brand.name}" está en la papelera: restáurala antes de asignarle productos`,
        code: 422,
      }
    }

    await db.product.update({ where: { id: productId }, data: { brandId: newBrandId } })
    invalidateBrandCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, {
      foreignKey: 'La marca de destino no existe',
      notFound: 'Producto no encontrado',
      fallback: 'No se pudo reasignar la marca',
    })
  }
}

// ---------------------------------------------------------------------------
// deleteBrand — a la papelera (soft delete)
// ---------------------------------------------------------------------------

export async function deleteBrand(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de marca requerido', code: 400 }

  try {
    const brand = await findBrandById(id)
    if (!brand) return { success: false, error: 'Marca no encontrada', code: 404 }

    if (brand.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la marca tiene ${brand.productCount} producto(s) asociado(s)`,
        code: 422,
      }
    }

    await db.brand.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateBrandCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, { notFound: 'Marca no encontrada', fallback: 'No se pudo eliminar la marca' })
  }
}

// ---------------------------------------------------------------------------
// importBrands
//
// Filas del Excel ya parseadas por el cliente (máx. 500). Upsert por slug; sin
// slug, por nombre. Celdas vacías no pisan valores existentes. Las marcas
// (vivas y de la papelera) se precargan una sola vez.
// ---------------------------------------------------------------------------

const IMPORT_MAX_ROWS = 500

const importBrandRowSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  slug: slugSchema.optional().or(z.literal('')).default(''),
  tagline: z.string().max(80).optional().default(''),
  description: z.string().max(500).optional().default(''),
  imageUrl: imageUrlSchema().optional().or(z.literal('')).default(''),
})

export type ImportBrandRow = z.infer<typeof importBrandRowSchema>

export async function importBrands(
  rawRows: unknown,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = z
    .array(importBrandRowSchema)
    .max(IMPORT_MAX_ROWS, `Máximo ${IMPORT_MAX_ROWS} filas por importación`)
    .safeParse(rawRows)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.find((i) => i.path.length === 0)?.message ?? 'Formato de importación inválido',
      code: 400,
    }
  }

  const errors: string[] = []
  let created = 0
  let updated = 0

  let all: { id: string; name: string; slug: string; deletedAt: Date | null }[]
  let position: number
  try {
    all = await db.brand.findMany({ select: { id: true, name: true, slug: true, deletedAt: true } })
    position = await nextBrandPosition()
  } catch {
    return { success: false, error: 'No se pudieron cargar las marcas', code: 500 }
  }
  const takenSlugs = new Set(all.map((b) => b.slug))
  const key = (s: string) => slugify(s)

  for (const row of parsed.data) {
    const label = `Fila "${row.name}"`
    try {
      const existing = row.slug
        ? all.find((b) => b.slug === row.slug)
        : all.find((b) => key(b.name) === key(row.name) || b.slug === key(row.name))

      if (existing?.deletedAt) {
        errors.push(`${label}: ${trashedConflictError(existing.name)}`)
        continue
      }

      // El nombre es único global: otra marca (viva o en la papelera) no puede tenerlo.
      const nameOwner = all.find((b) => b.id !== existing?.id && key(b.name) === key(row.name))
      if (nameOwner) {
        errors.push(
          `${label}: ${nameOwner.deletedAt ? trashedConflictError(nameOwner.name) : `ya existe la marca "${nameOwner.name}"`}`,
        )
        continue
      }

      if (existing) {
        await db.brand.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            ...(row.tagline && { tagline: row.tagline }),
            ...(row.description && { description: row.description }),
            ...(row.imageUrl && { imageUrl: row.imageUrl }),
          },
        })
        existing.name = row.name
        updated++
      } else {
        const slug = row.slug || uniqueSlug(row.name, takenSlugs, 'marca')
        takenSlugs.add(slug)
        const createdBrand = await db.brand.create({
          data: {
            name: row.name,
            slug,
            tagline: row.tagline || null,
            description: row.description || null,
            imageUrl: row.imageUrl || null,
            position: position++,
          },
          select: { id: true },
        })
        all.push({ id: createdBrand.id, name: row.name, slug, deletedAt: null })
        created++
      }
    } catch (err) {
      errors.push(`${label}: ${prismaErrorMessage(err, { ...SAVE_ERRORS, fallback: 'no se pudo guardar' })}`)
    }
  }

  if (created + updated > 0) invalidateBrandCaches()
  return { success: true, data: { created, updated, errors } }
}
