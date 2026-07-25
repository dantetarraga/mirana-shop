import 'server-only'
import { db } from '@/shared/lib/db'
import type { TrashCounts, TrashRow, TrashType } from '@/features/trash/types'

// ---------------------------------------------------------------------------
// Motivos de bloqueo
//
// Las relaciones de historial (OrderItem, Preorder, InventoryMovement, Order)
// no declaran onDelete en el schema, así que son RESTRICT: la base de datos
// rechaza el DELETE mientras existan. Eso es deliberado — un pedido pasado no
// debe poder quedarse sin su producto — y significa que la purga de esas filas
// es imposible, no solo desaconsejada. Se calcula el motivo acá para que la UI
// pueda deshabilitar el botón y explicar por qué.
// ---------------------------------------------------------------------------

function joinReasons(parts: string[]): string | null {
  if (parts.length === 0) return null
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`
  return `Tiene ${list} — eliminarlo rompería ese historial`
}

function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

// ---------------------------------------------------------------------------
// Conteos por tipo — alimentan los tabs
// ---------------------------------------------------------------------------

export async function getTrashCounts(): Promise<TrashCounts> {
  const deleted = { deletedAt: { not: null } } as const

  const [product, collection, category, brand, user] = await Promise.all([
    db.product.count({ where: deleted }),
    db.collection.count({ where: deleted }),
    db.category.count({ where: deleted }),
    db.brand.count({ where: deleted }),
    db.user.count({ where: deleted }),
  ])

  return { product, collection, category, brand, user }
}

// ---------------------------------------------------------------------------
// Filas por tipo
// ---------------------------------------------------------------------------

async function getDeletedProducts(): Promise<TrashRow[]> {
  const rows = await db.product.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      name: true,
      sku: true,
      deletedAt: true,
      _count: { select: { orderItems: true, preorders: true, movements: true } },
    },
    orderBy: { deletedAt: 'desc' },
  })

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    sub: p.sku,
    deletedAt: p.deletedAt!,
    purgeBlockedReason: joinReasons([
      ...(p._count.orderItems > 0
        ? [plural(p._count.orderItems, 'línea de pedido', 'líneas de pedido')]
        : []),
      ...(p._count.preorders > 0 ? [plural(p._count.preorders, 'preorden', 'preórdenes')] : []),
      ...(p._count.movements > 0
        ? [plural(p._count.movements, 'movimiento de inventario', 'movimientos de inventario')]
        : []),
    ]),
  }))
}

async function getDeletedCollections(): Promise<TrashRow[]> {
  const rows = await db.collection.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, name: true, slug: true, deletedAt: true },
    orderBy: { deletedAt: 'desc' },
  })

  // Su única relación es ProductCollection, que sí cascadea: nunca se bloquea.
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    sub: c.slug,
    deletedAt: c.deletedAt!,
    purgeBlockedReason: null,
  }))
}

async function getDeletedCategories(): Promise<TrashRow[]> {
  const rows = await db.category.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      deletedAt: true,
      // Sin filtrar por deletedAt: un producto en la papelera sigue teniendo la
      // FK puesta y basta para que el DELETE falle. `children` es la
      // auto-relación CategoryTree, que también es RESTRICT.
      _count: { select: { products: true, children: true } },
    },
    orderBy: { deletedAt: 'desc' },
  })

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    sub: c.slug,
    deletedAt: c.deletedAt!,
    purgeBlockedReason:
      c._count.products > 0
        ? `${plural(c._count.products, 'producto', 'productos')} (incluidos los que están en la papelera) todavía usan la categoría`
        : c._count.children > 0
          ? `Tiene ${plural(c._count.children, 'subcategoría', 'subcategorías')} que dependen de ella`
          : null,
  }))
}

async function getDeletedBrands(): Promise<TrashRow[]> {
  const rows = await db.brand.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      deletedAt: true,
      _count: { select: { products: true } },
    },
    orderBy: { deletedAt: 'desc' },
  })

  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    sub: b.slug,
    deletedAt: b.deletedAt!,
    purgeBlockedReason:
      b._count.products > 0
        ? `${plural(b._count.products, 'producto', 'productos')} (incluidos los que están en la papelera) todavía usan la marca`
        : null,
  }))
}

async function getDeletedUsers(): Promise<TrashRow[]> {
  const rows = await db.user.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      deletedAt: true,
      _count: { select: { orders: true, preorders: true } },
    },
    orderBy: { deletedAt: 'desc' },
  })

  return rows.map((u) => ({
    id: u.id,
    name: u.name ?? 'Sin nombre',
    sub: u.email,
    deletedAt: u.deletedAt!,
    purgeBlockedReason: joinReasons([
      ...(u._count.orders > 0 ? [plural(u._count.orders, 'pedido', 'pedidos')] : []),
      ...(u._count.preorders > 0 ? [plural(u._count.preorders, 'preorden', 'preórdenes')] : []),
    ]),
  }))
}

export async function getTrashItems(type: TrashType): Promise<TrashRow[]> {
  switch (type) {
    case 'product':
      return getDeletedProducts()
    case 'collection':
      return getDeletedCollections()
    case 'category':
      return getDeletedCategories()
    case 'brand':
      return getDeletedBrands()
    case 'user':
      return getDeletedUsers()
  }
}
