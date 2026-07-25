// ---------------------------------------------------------------------------
// Papelera — entidades con borrado lógico (`deletedAt`)
//
// Solo estas cinco tienen soft delete en el schema. El resto (banners,
// promociones, cuentas de pago, direcciones) se borra de verdad al instante y
// por eso nunca aparece acá.
// ---------------------------------------------------------------------------

export const TRASH_TYPES = ['product', 'collection', 'category', 'brand', 'user'] as const

export type TrashType = (typeof TRASH_TYPES)[number]

export const TRASH_TYPE_LABELS: Record<TrashType, string> = {
  product: 'Productos',
  collection: 'Colecciones',
  category: 'Categorías',
  brand: 'Marcas',
  user: 'Usuarios',
}

export type TrashRow = {
  id: string
  /** Nombre visible en la primera línea de la fila. */
  name: string
  /** Segunda línea: slug, SKU o email según el tipo. */
  sub: string | null
  deletedAt: Date
  /**
   * Motivo por el que la purga está bloqueada, o `null` si se puede eliminar
   * definitivamente. Las FK del schema son RESTRICT a propósito (para no
   * romper pedidos pasados), así que hay filas que nunca podrán purgarse
   * mientras exista el historial que las referencia.
   */
  purgeBlockedReason: string | null
}

export type TrashCounts = Record<TrashType, number>
