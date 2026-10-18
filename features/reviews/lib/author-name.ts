// ---------------------------------------------------------------------------
// Nombre público del autor de una reseña: "Nombre A." (nombre + inicial del
// último apellido). Nunca se muestra el correo: si la cuenta no tiene nombre
// se usa un genérico.
// ---------------------------------------------------------------------------

export const ANONYMOUS_AUTHOR = 'Cliente Mirana'

function capitalize(word: string): string {
  const lower = word.toLocaleLowerCase('es-PE')
  return lower.charAt(0).toLocaleUpperCase('es-PE') + lower.slice(1)
}

export function formatAuthorName(name: string | null | undefined): string {
  // Un "nombre" con @ es un correo guardado como nombre: no se expone.
  const clean = (name ?? '')
    .replace(/\S*@\S*/g, ' ')
    .replace(/[^\p{L}\p{M}\s'-]/gu, ' ')
    .trim()
  const parts = clean.split(/\s+/).filter((p) => /\p{L}/u.test(p))
  if (parts.length === 0) return ANONYMOUS_AUTHOR

  const first = capitalize(parts[0])
  if (parts.length === 1) return first

  const last = parts[parts.length - 1].replace(/^[^\p{L}]+/u, '')
  return `${first} ${last.charAt(0).toLocaleUpperCase('es-PE')}.`
}
