// ---------------------------------------------------------------------------
// Límites del menú de la tienda (docs/NAVEGACION-CATALOGO.md §2).
// Los usan el mega-menú, el menú móvil y la vista previa del admin: cambiar
// un número aquí cambia los tres.
// ---------------------------------------------------------------------------

/** Niveles del árbol: Categoría → Subcategoría. */
export const MAX_CATEGORY_DEPTH = 2

/** Raíces visibles en la barra de escritorio; el resto va a "Más". */
export const MENU_MAX_ROOTS = 6

/** Subcategorías por columna del mega-menú; después, "Ver todo {Categoría}". */
export const MENU_MAX_CHILDREN = 6

/** Logos de marcas destacadas en el mega-menú; después, "Todas las marcas". */
export const MENU_MAX_FEATURED_BRANDS = 8

/** Colecciones activas bajo las marcas en el mega-menú. */
export const MENU_MAX_COLLECTIONS = 4

/** Etiqueta del ítem de desborde de la barra. */
export const MENU_OVERFLOW_LABEL = 'Más'

/**
 * Reparte las raíces del menú entre la barra y el desborde "Más".
 * Espera la lista ya filtrada y ordenada por `position`.
 */
export function splitMenuRoots<T>(roots: readonly T[], max = MENU_MAX_ROOTS) {
  return { bar: roots.slice(0, max), overflow: roots.slice(max) }
}

/** Subcategorías de una columna + si hace falta el enlace "Ver todo". */
export function limitMenuChildren<T>(children: readonly T[], max = MENU_MAX_CHILDREN) {
  return { shown: children.slice(0, max), hasMore: children.length > max }
}
