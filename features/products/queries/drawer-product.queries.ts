import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/shared/lib/db'
import type { DrawerProduct } from '@/shared/types/entity-products.types'

// ---------------------------------------------------------------------------
// Proyección única de producto para los paneles/drawers del admin
// (productos de una marca, categoría o colección y el buscador "Agregar").
// Antes cada action repetía el mismo select + map.
//
// No verifica permisos: cada action que la usa hace su propio requireAdmin().
// Siempre excluye los productos en la papelera.
// ---------------------------------------------------------------------------

const DRAWER_PRODUCT_SELECT = {
  id: true,
  name: true,
  sku: true,
  price: true,
  status: true,
  images: {
    select: { url: true },
    orderBy: { position: 'asc' },
    take: 1,
  },
  category: { select: { name: true } },
  brand: { select: { name: true } },
  inventory: { select: { availableStock: true } },
} satisfies Prisma.ProductSelect

export async function findDrawerProducts({
  where,
  take,
}: {
  where: Prisma.ProductWhereInput
  take?: number
}): Promise<DrawerProduct[]> {
  const products = await db.product.findMany({
    where: { ...where, deletedAt: null },
    select: DRAWER_PRODUCT_SELECT,
    orderBy: { name: 'asc' },
    ...(take !== undefined && { take }),
  })

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    status: p.status,
    imageUrl: p.images[0]?.url ?? null,
    category: p.category.name,
    brand: p.brand.name,
    stock: p.inventory?.availableStock ?? 0,
  }))
}
