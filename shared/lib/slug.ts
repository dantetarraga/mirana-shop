// ---------------------------------------------------------------------------
// Slugs — ÚNICA implementación del sitio.
//
// Antes había tres (utils.slugify, useAutoSlug.toSlug y una copia en
// product.actions) que no coincidían: "Anime & Manga" daba "anime--manga" en
// el servidor y "anime-manga" en el formulario. Ahora todo sale de aquí.
//
// Compatibilidad: solo se usa para generar slugs NUEVOS o como clave de
// comparación. Los slugs ya guardados no se regeneran nunca (romperían URLs
// indexadas y enlaces de banners).
// ---------------------------------------------------------------------------

/**
 * "Figuras de Acción & Más" → "figuras-de-accion-mas".
 * Minúsculas, sin tildes (ñ → n), cualquier racha de caracteres no
 * alfanuméricos se vuelve un guion, sin guiones en los extremos.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Formato que aceptan los esquemas Zod de las actions. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/

/**
 * Slug libre a partir de `name`: si ya está tomado agrega -2, -3…
 * Registra el resultado en `taken` para que la fila siguiente lo vea.
 */
export function uniqueSlug(name: string, taken: Set<string>, fallback = 'item'): string {
  const base = slugify(name) || fallback
  let candidate = base
  let i = 2
  while (taken.has(candidate)) candidate = `${base}-${i++}`
  taken.add(candidate)
  return candidate
}
