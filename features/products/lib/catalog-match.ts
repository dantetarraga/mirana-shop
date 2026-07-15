// ---------------------------------------------------------------------------
// catalog-match — resuelve el texto de categoría/marca de un Excel contra
// las opciones existentes, tolerando tildes, mayúsculas y variantes cortas
// ("Figuras" → "Figuras de Acción"). Usado tanto en el preview del cliente
// (ExcelImportDrawer) como en el server action (importProducts) para que
// ambos lados decidan lo mismo.
// ---------------------------------------------------------------------------

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
    }
    prev = curr
  }
  return prev[n]
}

// Similitud en [0, 1]. Match exacto = 1. Si una cadena está contenida en la
// otra y no es demasiado corta (evita que "F" matchee cualquier cosa), se
// trata como abreviación probable y se puntúa alto. En el resto de casos se
// usa distancia de edición normalizada (tolera typos).
function similarity(a: string, b: string): number {
  const na = normalizeForMatch(a)
  const nb = normalizeForMatch(b)
  if (!na || !nb) return 0
  if (na === nb) return 1

  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na]
  if (shorter.length >= 4 && longer.includes(shorter)) {
    return 0.7 + 0.2 * (shorter.length / longer.length)
  }

  const dist = levenshtein(na, nb)
  return 1 - dist / Math.max(na.length, nb.length)
}

export interface MatchOption {
  name: string
  slug: string
}

// Umbral elegido para tolerar typos y abreviaciones razonables sin fusionar
// categorías/marcas genuinamente distintas por accidente.
const MATCH_THRESHOLD = 0.72

export function findBestMatch<T extends MatchOption>(
  query: string,
  options: T[],
  threshold = MATCH_THRESHOLD,
): T | undefined {
  const needle = query.trim()
  if (!needle) return undefined

  let best: T | undefined
  let bestScore = 0
  for (const option of options) {
    const score = Math.max(similarity(needle, option.name), similarity(needle, option.slug))
    if (score > bestScore) {
      bestScore = score
      best = option
    }
  }
  return bestScore >= threshold ? best : undefined
}
