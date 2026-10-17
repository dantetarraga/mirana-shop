'use server'

import { TRASH_TYPES, type TrashType } from '@/features/trash/types'
import { db } from '@/shared/lib/db'
import { prismaFailure } from '@/shared/lib/prisma-errors'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

const typeSchema = z.enum(TRASH_TYPES)

// ---------------------------------------------------------------------------
// Cache invalidation
//
// Restaurar o purgar puede tocar cualquier superficie del catálogo, así que se
// invalida en bloque: es una operación manual y poco frecuente, no vale la
// pena afinar por tipo.
// ---------------------------------------------------------------------------

function invalidateEverything() {
  for (const path of [
    '/admin/trash',
    '/admin/products',
    '/admin/collections',
    '/admin/categories',
    '/admin/brands',
    '/admin/users',
    '/admin/inventory',
    '/admin/dashboard',
    '/catalogo',
    '/',
  ]) {
    revalidatePath(path)
  }
  revalidatePath('/catalogo/[slug]', 'page')
  revalidatePath('/colecciones/[slug]', 'page')

  for (const tag of ['products', 'collections', 'categories', 'brands', 'catalog']) {
    revalidateTag(tag, 'max')
  }
}

// ---------------------------------------------------------------------------
// Lectura del estado real de la fila
//
// Todo lo que la UI dice (que está borrada, que se puede purgar) se vuelve a
// comprobar acá: una Server Action es un endpoint público y el botón
// deshabilitado del cliente no es una garantía.
// ---------------------------------------------------------------------------

async function findDeleted(type: TrashType, id: string): Promise<boolean> {
  const where = { id, deletedAt: { not: null } } as const

  switch (type) {
    case 'product':
      return (await db.product.count({ where })) > 0
    case 'collection':
      return (await db.collection.count({ where })) > 0
    case 'category':
      return (await db.category.count({ where })) > 0
    case 'brand':
      return (await db.brand.count({ where })) > 0
    case 'user':
      return (await db.user.count({ where })) > 0
  }
}

/** `null` si la purga es posible; el motivo del bloqueo si no. */
async function findPurgeBlocker(type: TrashType, id: string): Promise<string | null> {
  switch (type) {
    case 'product': {
      const [orderItems, preorders, movements] = await Promise.all([
        db.orderItem.count({ where: { productId: id } }),
        db.preorder.count({ where: { productId: id } }),
        db.inventoryMovement.count({ where: { productId: id } }),
      ])
      return orderItems + preorders + movements > 0
        ? 'El producto tiene historial de ventas, preórdenes o movimientos de inventario: eliminarlo definitivamente rompería esos registros'
        : null
    }

    case 'collection':
      // ProductCollection cascadea; no hay nada más que la referencie.
      return null

    case 'category': {
      // Además de los productos, la auto-relación CategoryTree también es
      // RESTRICT: una categoría con hijas no se puede borrar.
      const [products, children] = await Promise.all([
        db.product.count({ where: { categoryId: id } }),
        db.category.count({ where: { parentId: id } }),
      ])
      if (products > 0) {
        return 'Todavía hay productos (incluidos los de la papelera) que usan esta categoría'
      }
      return children > 0 ? 'Esta categoría tiene subcategorías que dependen de ella' : null
    }

    case 'brand': {
      const products = await db.product.count({ where: { brandId: id } })
      return products > 0
        ? 'Todavía hay productos (incluidos los de la papelera) que usan esta marca'
        : null
    }

    case 'user': {
      const [orders, preorders] = await Promise.all([
        db.order.count({ where: { userId: id } }),
        db.preorder.count({ where: { userId: id } }),
      ])
      return orders + preorders > 0
        ? 'El usuario tiene pedidos o preórdenes: eliminarlo definitivamente rompería ese historial'
        : null
    }
  }
}

/**
 * `null` si se puede restaurar; el motivo si no. Una fila restaurada no puede
 * apuntar a algo que sigue en la papelera: el producto quedaría colgando de
 * una categoría/marca invisible y la subcategoría de un padre borrado.
 */
async function findRestoreBlocker(type: TrashType, id: string): Promise<string | null> {
  switch (type) {
    case 'product': {
      const product = await db.product.findUnique({
        where: { id },
        select: {
          category: { select: { name: true, deletedAt: true } },
          brand: { select: { name: true, deletedAt: true } },
        },
      })
      if (!product) return null
      const trashed = [
        product.category.deletedAt ? `la categoría "${product.category.name}"` : null,
        product.brand.deletedAt ? `la marca "${product.brand.name}"` : null,
      ].filter(Boolean)
      return trashed.length > 0
        ? `Restaura primero ${trashed.join(' y ')}: también está en la papelera`
        : null
    }

    case 'category': {
      const category = await db.category.findUnique({
        where: { id },
        select: {
          name: true,
          parentId: true,
          parent: { select: { name: true, deletedAt: true } },
        },
      })
      if (!category) return null
      if (category.parent?.deletedAt) {
        return `Restaura primero la categoría padre "${category.parent.name}": también está en la papelera`
      }
      // Nombre único entre hermanas. El índice (parentId, name) no cubre las
      // raíces en MariaDB (NULL ≠ NULL), así que se comprueba aquí.
      const twin = await db.category.findFirst({
        where: { parentId: category.parentId, name: category.name, deletedAt: null, NOT: { id } },
        select: { id: true },
      })
      return twin
        ? `Ya existe otra categoría "${category.name}" en el mismo nivel: renómbrala antes de restaurar esta`
        : null
    }

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// restoreTrashItem
// ---------------------------------------------------------------------------

export async function restoreTrashItem(rawType: string, id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsedType = typeSchema.safeParse(rawType)
  if (!parsedType.success) return { success: false, error: 'Tipo inválido', code: 400 }
  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  const type = parsedType.data

  try {
    if (!(await findDeleted(type, id))) {
      return { success: false, error: 'El elemento no está en la papelera', code: 404 }
    }

    const blocker = await findRestoreBlocker(type, id)
    if (blocker) return { success: false, error: blocker, code: 422 }

    if (type === 'product') {
      // Conserva todos los contadores y la versión del inventario archivado.
      // Solo los productos antiguos que perdieron su fila se recrean en cero;
      // sus existencias deben reconciliarse manualmente.
      await db.$transaction([
        db.productInventory.upsert({
          where: { productId: id },
          create: { productId: id, availableStock: 0 },
          update: {},
        }),
        db.product.update({ where: { id }, data: { deletedAt: null } }),
      ])
    } else if (type === 'collection') {
      await db.collection.update({ where: { id }, data: { deletedAt: null } })
    } else if (type === 'category') {
      await db.category.update({ where: { id }, data: { deletedAt: null } })
    } else if (type === 'brand') {
      await db.brand.update({ where: { id }, data: { deletedAt: null } })
    } else {
      await db.user.update({ where: { id }, data: { deletedAt: null } })
    }

    invalidateEverything()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, {
      unique: 'Otro elemento activo ya usa ese nombre, slug o SKU: cámbialo antes de restaurar',
      notFound: 'El elemento ya no existe',
      fallback: 'No se pudo restaurar',
    })
  }
}

// ---------------------------------------------------------------------------
// purgeTrashItem — borrado real e irreversible
// ---------------------------------------------------------------------------

export async function purgeTrashItem(rawType: string, id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsedType = typeSchema.safeParse(rawType)
  if (!parsedType.success) return { success: false, error: 'Tipo inválido', code: 400 }
  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  const type = parsedType.data

  try {
    // Solo se purga lo que ya está en la papelera: nunca un atajo para saltarse
    // el borrado en dos pasos.
    if (!(await findDeleted(type, id))) {
      return { success: false, error: 'El elemento no está en la papelera', code: 404 }
    }

    const blocker = await findPurgeBlocker(type, id)
    if (blocker) return { success: false, error: blocker, code: 422 }

    if (type === 'product') {
      // Cascadean ProductImage, ProductInventory, CartItem y ProductCollection.
      await db.product.delete({ where: { id } })
    } else if (type === 'collection') {
      await db.collection.delete({ where: { id } })
    } else if (type === 'category') {
      await db.category.delete({ where: { id } })
    } else if (type === 'brand') {
      await db.brand.delete({ where: { id } })
    } else {
      // Cascadean Profile, UserAddress, Account, Session y Cart.
      await db.user.delete({ where: { id } })
    }

    invalidateEverything()
    return { success: true, data: undefined }
  } catch (err) {
    return prismaFailure(err, {
      foreignKey: 'Todavía hay registros que dependen de este elemento',
      notFound: 'El elemento ya no existe',
      fallback: 'No se pudo eliminar definitivamente',
    })
  }
}
