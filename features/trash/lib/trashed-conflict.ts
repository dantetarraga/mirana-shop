import 'server-only'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// findTrashedConflict
//
// Los índices únicos (`name`, `slug`, `sku`) son de la base de datos y no saben
// nada de `deletedAt`: una fila en la papelera sigue reservando sus valores.
// Los chequeos de "ya existe" de las actions usan queries que filtran
// `deletedAt: null`, así que no la ven y el INSERT terminaba muriendo con el
// P2002 crudo de Prisma en la cara del usuario.
//
// Devuelve el nombre de la fila en conflicto, o null si no hay ninguna.
// ---------------------------------------------------------------------------

export type TrashConflictType = 'product' | 'collection' | 'category' | 'brand'

export type UniqueFields = {
  name?: string
  slug?: string
  sku?: string
}

/** Campos con índice único por modelo — `name` no lo es en Product. */
const UNIQUE_FIELDS: Record<TrashConflictType, Array<keyof UniqueFields>> = {
  product: ['slug', 'sku'],
  collection: ['name', 'slug'],
  category: ['name', 'slug'],
  brand: ['name', 'slug'],
}

export async function findTrashedConflict(
  type: TrashConflictType,
  fields: UniqueFields,
  /** ID a excluir: en una edición, la propia fila no es un conflicto. */
  excludeId?: string,
): Promise<string | null> {
  const or = UNIQUE_FIELDS[type]
    .filter((f) => fields[f] !== undefined && fields[f] !== '')
    .map((f) => ({ [f]: fields[f] }))

  if (or.length === 0) return null

  const where = {
    deletedAt: { not: null },
    OR: or,
    ...(excludeId ? { NOT: { id: excludeId } } : {}),
  }
  const select = { name: true } as const

  const row =
    type === 'product'
      ? await db.product.findFirst({ where, select })
      : type === 'collection'
        ? await db.collection.findFirst({ where, select })
        : type === 'category'
          ? await db.category.findFirst({ where, select })
          : await db.brand.findFirst({ where, select })

  return row?.name ?? null
}

/** Mensaje uniforme para el ActionResult de las actions que lo usan. */
export function trashedConflictError(name: string): string {
  return `"${name}" está en la papelera y sigue ocupando ese nombre, slug o SKU. Restáuralo o elimínalo definitivamente desde Configuración → Papelera.`
}
