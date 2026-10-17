'use server'

import {
  applyMoves,
  findParentError,
  validateTree,
  type TreeItem,
} from '@/features/categories/lib/category-tree'
import { findCategoryById } from '@/features/categories/queries/category.queries'
import { findDrawerProducts } from '@/features/products/queries/drawer-product.queries'
import { trashedConflictError } from '@/features/trash/lib/trashed-conflict'
import { db } from '@/shared/lib/db'
import { prismaFailure, prismaErrorMessage } from '@/shared/lib/prisma-errors'
import { requireAdmin } from '@/shared/lib/require-admin'
import { slugify, SLUG_PATTERN, uniqueSlug } from '@/shared/lib/slug'
import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Reglas de integridad (docs/NAVEGACION-CATALOGO.md §4) — todas en servidor:
//   · sin ciclos y como máximo 2 niveles (category-tree.ts)
//   · el padre existe y no está en la papelera, también al editar
//   · nombre único entre hermanas (en MariaDB el índice no cubre las raíces
//     porque NULL ≠ NULL: se valida aquí)
//   · no se manda a la papelera un padre con hijas vivas
//   · `showInMenu` solo vale en raíces
//   · nunca se devuelve el mensaje crudo de Prisma
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .min(1, 'Slug requerido')
  .regex(SLUG_PATTERN, 'Solo minúsculas, números y guiones')

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  slug: slugSchema,
  parentId: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  imageUrl: imageUrlSchema().optional().or(z.literal('')),
  isVisible: z.boolean().optional(),
  showInMenu: z.boolean().optional(),
})

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

const flagsSchema = z
  .object({
    id: z.string().min(1, 'ID requerido'),
    isVisible: z.boolean().optional(),
    showInMenu: z.boolean().optional(),
  })
  .refine((v) => v.isVisible !== undefined || v.showInMenu !== undefined, 'Nada que cambiar')

const reorderSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      parentId: z.string().min(1).nullable(),
      position: z.number().int().min(0).max(100_000),
    }),
  )
  .min(1, 'Nada que reordenar')
  .max(1000, 'Demasiados cambios a la vez')

const SAVE_ERRORS = {
  unique: 'Ya existe una categoría con ese nombre en el mismo nivel, o con ese slug',
  foreignKey: 'La categoría padre no existe o está en la papelera',
  notFound: 'Categoría no encontrada',
}

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateCategoryCaches() {
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidateTag('categories', 'max')
  revalidateTag('catalog', 'max')
  // Las tarjetas de producto muestran el nombre de la categoría.
  revalidateTag('products', 'max')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LiveCategory = TreeItem & { name: string; slug: string; position: number }

/** Categorías vivas como lista plana para validar el árbol. */
async function loadLiveTree(): Promise<LiveCategory[]> {
  return db.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true, parentId: true, position: true },
  })
}

/** Siguiente `position` libre entre las hermanas de `parentId`. */
function nextPosition(tree: readonly LiveCategory[], parentId: string | null, excludeId?: string) {
  const siblings = tree.filter((c) => c.parentId === parentId && c.id !== excludeId)
  return siblings.length === 0 ? 0 : Math.max(...siblings.map((c) => c.position)) + 1
}

/** Slug ocupado (viva o en la papelera) por otra fila → mensaje; null si libre. */
async function findSlugConflict(slug: string, excludeId?: string): Promise<string | null> {
  const row = await db.category.findUnique({
    where: { slug },
    select: { id: true, name: true, deletedAt: true },
  })
  if (!row || row.id === excludeId) return null
  return row.deletedAt ? trashedConflictError(row.name) : 'Ya existe una categoría con ese slug'
}

/**
 * Hermana con el mismo nombre (viva o en la papelera) → mensaje; null si libre.
 * La colación de MariaDB compara sin mayúsculas ni tildes, igual que el índice.
 */
async function findSiblingNameConflict(
  parentId: string | null,
  name: string,
  excludeId?: string,
): Promise<string | null> {
  const row = await db.category.findFirst({
    where: { parentId, name, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { name: true, deletedAt: true, parent: { select: { name: true } } },
  })
  if (!row) return null
  if (row.deletedAt) return trashedConflictError(row.name)
  return row.parent
    ? `Ya existe "${row.name}" dentro de "${row.parent.name}"`
    : `Ya existe una categoría principal llamada "${row.name}"`
}

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------

export async function createCategory(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = createCategorySchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const { name, slug, description, imageUrl, isVisible, showInMenu } = parsed.data
  const parentId = parsed.data.parentId || null

  try {
    const tree = await loadLiveTree()

    const parentError = findParentError(tree, null, parentId)
    if (parentError) return { success: false, error: parentError, code: 422 }

    const conflict =
      (await findSlugConflict(slug)) ?? (await findSiblingNameConflict(parentId, name))
    if (conflict) return { success: false, error: conflict, code: 409 }

    const category = await db.category.create({
      data: {
        name,
        slug,
        parentId,
        description: description || null,
        imageUrl: imageUrl || null,
        position: nextPosition(tree, parentId),
        isVisible: isVisible ?? true,
        // El menú solo lista raíces. Una raíz nueva entra si el admin lo pide.
        showInMenu: parentId ? false : (showInMenu ?? false),
      },
      select: { id: true },
    })

    invalidateCategoryCaches()
    return { success: true, data: { id: category.id } }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo crear la categoría' })
  }
}

// ---------------------------------------------------------------------------
// updateCategory
// ---------------------------------------------------------------------------

export async function updateCategory(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = updateCategorySchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const { id, ...fields } = parsed.data

  try {
    const tree = await loadLiveTree()
    const current = tree.find((c) => c.id === id)
    if (!current) return { success: false, error: 'Categoría no encontrada', code: 404 }

    // undefined = no se toca; null o "" = pasar a raíz.
    const parentChanged =
      fields.parentId !== undefined && (fields.parentId || null) !== current.parentId
    const parentId = fields.parentId !== undefined ? fields.parentId || null : current.parentId
    const name = fields.name ?? current.name

    if (parentChanged) {
      const parentError = findParentError(tree, id, parentId)
      if (parentError) return { success: false, error: parentError, code: 422 }
    }

    if (fields.slug && fields.slug !== current.slug) {
      const slugConflict = await findSlugConflict(fields.slug, id)
      if (slugConflict) return { success: false, error: slugConflict, code: 409 }
    }

    if (parentChanged || name !== current.name) {
      const nameConflict = await findSiblingNameConflict(parentId, name, id)
      if (nameConflict) return { success: false, error: nameConflict, code: 409 }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.description !== undefined && { description: fields.description || null }),
        ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl || null }),
        ...(fields.isVisible !== undefined && { isVisible: fields.isVisible }),
        // Al cambiar de padre va al final de sus nuevas hermanas.
        ...(parentChanged && { parentId, position: nextPosition(tree, parentId, id) }),
        ...(parentId
          ? { showInMenu: false }
          : fields.showInMenu !== undefined && { showInMenu: fields.showInMenu }),
      },
      select: { id: true },
    })

    invalidateCategoryCaches()
    return { success: true, data: { id: category.id } }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo actualizar la categoría' })
  }
}

// ---------------------------------------------------------------------------
// setCategoryFlags — switches inline del árbol (Visible / En menú)
// ---------------------------------------------------------------------------

export async function setCategoryFlags(rawInput: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = flagsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const { id, isVisible, showInMenu } = parsed.data

  try {
    const category = await db.category.findFirst({
      where: { id, deletedAt: null },
      select: { parentId: true },
    })
    if (!category) return { success: false, error: 'Categoría no encontrada', code: 404 }
    if (showInMenu && category.parentId) {
      return {
        success: false,
        error: 'Solo las categorías principales pueden ir en el menú',
        code: 422,
      }
    }

    await db.category.update({
      where: { id },
      data: {
        ...(isVisible !== undefined && { isVisible }),
        ...(showInMenu !== undefined && { showInMenu }),
      },
    })

    invalidateCategoryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo actualizar la categoría' })
  }
}

// ---------------------------------------------------------------------------
// reorderCategories — arrastrar y soltar del árbol
//
// Recibe el nuevo padre y posición de cada categoría afectada. Se valida el
// árbol RESULTANTE completo (ciclos, profundidad, nombres entre hermanas) y
// se guarda todo en una transacción: o se aplica el reordenamiento entero o
// nada.
// ---------------------------------------------------------------------------

export async function reorderCategories(rawMoves: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = reorderSchema.safeParse(rawMoves)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }
  const moves = parsed.data

  if (new Set(moves.map((m) => m.id)).size !== moves.length) {
    return { success: false, error: 'Una categoría aparece dos veces', code: 400 }
  }

  try {
    const tree = await loadLiveTree()
    const liveIds = new Set(tree.map((c) => c.id))
    const missing = moves.find((m) => !liveIds.has(m.id))
    if (missing) {
      return {
        success: false,
        error: 'Una de las categorías ya no existe o está en la papelera. Recarga la página.',
        code: 409,
      }
    }

    const next = applyMoves(tree, moves)
    const treeError = validateTree(next)
    if (treeError) return { success: false, error: treeError, code: 422 }

    // Nombres únicos entre hermanas en el árbol resultante.
    const seen = new Map<string, string>()
    for (const c of next) {
      const key = `${c.parentId ?? ''}::${slugify(c.name)}`
      const other = seen.get(key)
      if (other) {
        return {
          success: false,
          error: `"${c.name}" y "${other}" quedarían como hermanas con el mismo nombre`,
          code: 409,
        }
      }
      seen.set(key, c.name)
    }

    await db.$transaction(
      moves.map((m) =>
        db.category.update({
          where: { id: m.id },
          data: {
            parentId: m.parentId,
            position: m.position,
            // Al volverse subcategoría sale del menú (solo raíces).
            ...(m.parentId && { showInMenu: false }),
          },
        }),
      ),
    )

    invalidateCategoryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, { ...SAVE_ERRORS, fallback: 'No se pudo guardar el nuevo orden' })
  }
}

// ---------------------------------------------------------------------------
// getCategoryProducts
// ---------------------------------------------------------------------------

export async function getCategoryProducts(
  categoryId: string,
): Promise<ActionResult<DrawerProduct[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    return { success: true, data: await findDrawerProducts({ where: { categoryId } }) }
  } catch {
    return { success: false, error: 'Error al cargar productos', code: 500 }
  }
}

// ---------------------------------------------------------------------------
// reassignProductCategory
// ---------------------------------------------------------------------------

export async function reassignProductCategory(
  productId: string,
  newCategoryId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!productId || !newCategoryId) {
    return { success: false, error: 'IDs de producto y categoría requeridos', code: 400 }
  }

  try {
    const [product, category] = await Promise.all([
      db.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true } }),
      db.category.findFirst({
        where: { id: newCategoryId },
        select: { name: true, deletedAt: true },
      }),
    ])
    if (!product) return { success: false, error: 'Producto no encontrado', code: 404 }
    if (!category) return { success: false, error: 'La categoría de destino no existe', code: 404 }
    if (category.deletedAt) {
      return {
        success: false,
        error: `"${category.name}" está en la papelera: restáurala antes de asignarle productos`,
        code: 422,
      }
    }

    await db.product.update({ where: { id: productId }, data: { categoryId: newCategoryId } })
    invalidateCategoryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, {
      foreignKey: 'La categoría de destino no existe',
      notFound: 'Producto no encontrado',
      fallback: 'No se pudo reasignar la categoría',
    })
  }
}

// ---------------------------------------------------------------------------
// deleteCategory — a la papelera (soft delete)
// ---------------------------------------------------------------------------

export async function deleteCategory(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de categoría requerido', code: 400 }

  try {
    const category = await findCategoryById(id)
    if (!category) return { success: false, error: 'Categoría no encontrada', code: 404 }

    const children = await db.category.count({ where: { parentId: id, deletedAt: null } })
    if (children > 0) {
      return {
        success: false,
        error: `Mueve o elimina ${children === 1 ? 'su subcategoría' : `sus ${children} subcategorías`} primero`,
        code: 422,
      }
    }

    if (category.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la categoría tiene ${category.productCount} producto(s) asociado(s)`,
        code: 422,
      }
    }

    await db.category.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateCategoryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, { notFound: 'Categoría no encontrada', fallback: 'No se pudo eliminar la categoría' })
  }
}

// ---------------------------------------------------------------------------
// importCategories
//
// Recibe filas del Excel ya parseadas por el cliente (máx. 500).
//   · Se busca por slug; sin slug, por nombre (dentro del padre indicado).
//   · La columna "Padre" acepta nombre o slug de una categoría PRINCIPAL viva
//     (o creada en una fila anterior del mismo archivo). Las filas sin padre se
//     procesan primero para que el orden del Excel no importe.
//   · Celdas vacías no pisan valores existentes (padre, descripción, imagen).
//   · Los slugs (vivos y de la papelera) se precargan una vez: los nuevos se
//     generan sin chocar.
// ---------------------------------------------------------------------------

const IMPORT_MAX_ROWS = 500

const importCategoryRowSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  slug: slugSchema.optional().or(z.literal('')).default(''),
  parent: z.string().trim().optional().default(''),
  description: z.string().max(500).optional().default(''),
  imageUrl: imageUrlSchema().optional().or(z.literal('')).default(''),
})

export type ImportCategoryRow = z.infer<typeof importCategoryRowSchema>

type ImportCategory = LiveCategory & { deletedAt: Date | null }

export async function importCategories(
  rawRows: unknown,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = z
    .array(importCategoryRowSchema)
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

  let all: ImportCategory[]
  try {
    all = await db.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true, position: true, deletedAt: true },
    })
  } catch {
    return { success: false, error: 'No se pudieron cargar las categorías', code: 500 }
  }

  const takenSlugs = new Set(all.map((c) => c.slug))
  const live = () => all.filter((c) => !c.deletedAt)
  const key = (s: string) => slugify(s)

  // Filas sin padre primero (orden estable): así una hija puede venir antes
  // que su padre en el Excel.
  const rows = parsed.data
    .map((row, index) => ({ row, index }))
    .sort((a, b) => Number(!!a.row.parent) - Number(!!b.row.parent) || a.index - b.index)

  for (const { row } of rows) {
    const label = `Fila "${row.name}"`
    try {
      // ── Padre ───────────────────────────────────────────────────────────
      let parentId: string | null = null
      if (row.parent) {
        const wanted = key(row.parent)
        const matches = live().filter((c) => c.slug === wanted || key(c.name) === wanted)
        const root = matches.find((c) => !c.parentId)
        if (!root) {
          errors.push(
            matches.length > 0
              ? `${label}: "${row.parent}" es una subcategoría; solo se permiten 2 niveles`
              : `${label}: categoría padre "${row.parent}" no encontrada`,
          )
          continue
        }
        parentId = root.id
      }

      // ── ¿Existe? ────────────────────────────────────────────────────────
      let existing: ImportCategory | undefined
      if (row.slug) {
        existing = all.find((c) => c.slug === row.slug)
        if (existing?.deletedAt) {
          errors.push(`${label}: ${trashedConflictError(existing.name)}`)
          continue
        }
      } else {
        const sameName = live().filter(
          (c) => key(c.name) === key(row.name) && (!row.parent || c.parentId === parentId),
        )
        if (sameName.length > 1) {
          errors.push(`${label}: hay varias categorías con ese nombre; indica el slug o el padre`)
          continue
        }
        existing = sameName[0]
      }

      const finalParentId = existing && !row.parent ? existing.parentId : parentId
      const parentError = findParentError(live(), existing?.id ?? null, finalParentId)
      if (parentError) {
        errors.push(`${label}: ${parentError}`)
        continue
      }

      // Nombre único entre hermanas (vivas o en la papelera).
      const sibling = all.find(
        (c) =>
          c.id !== existing?.id && c.parentId === finalParentId && key(c.name) === key(row.name),
      )
      if (sibling) {
        errors.push(
          `${label}: ${sibling.deletedAt ? trashedConflictError(sibling.name) : `ya existe "${sibling.name}" en ese nivel`}`,
        )
        continue
      }

      if (existing) {
        const parentChanged = finalParentId !== existing.parentId
        const position = parentChanged
          ? nextPosition(live(), finalParentId, existing.id)
          : existing.position
        await db.category.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            ...(parentChanged && { parentId: finalParentId, position, showInMenu: false }),
            ...(row.description && { description: row.description }),
            ...(row.imageUrl && { imageUrl: row.imageUrl }),
          },
        })
        Object.assign(existing, { name: row.name, parentId: finalParentId, position })
        updated++
      } else {
        const slug = row.slug || uniqueSlug(row.name, takenSlugs, 'categoria')
        takenSlugs.add(slug)
        const position = nextPosition(live(), finalParentId)
        const createdCat = await db.category.create({
          data: {
            name: row.name,
            slug,
            parentId: finalParentId,
            position,
            description: row.description || null,
            imageUrl: row.imageUrl || null,
          },
          select: { id: true },
        })
        all.push({
          id: createdCat.id,
          name: row.name,
          slug,
          parentId: finalParentId,
          position,
          deletedAt: null,
        })
        created++
      }
    } catch (err) {
      errors.push(`${label}: ${prismaErrorMessage(err, { ...SAVE_ERRORS, fallback: 'no se pudo guardar' })}`)
    }
  }

  if (created + updated > 0) invalidateCategoryCaches()
  return { success: true, data: { created, updated, errors } }
}
