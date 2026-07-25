// ---------------------------------------------------------------------------
// Utilidades para el contenido HTML que produce el RichTextEditor (TipTap).
// El HTML se guarda tal cual en BD y se pinta con dangerouslySetInnerHTML, así
// que se sanea SIEMPRE antes de persistirlo (ver sanitizeRichText).
// ---------------------------------------------------------------------------

/** Etiquetas que puede emitir el editor y que se conservan al sanear. */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
])

/** Elementos que se eliminan enteros — etiqueta y contenido. */
const DANGEROUS_BLOCK = /<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi

const TAG = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g

const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i

const SAFE_HREF = /^(?:https?:\/\/|mailto:|tel:|\/|#)/i

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function safeHref(attrs: string): string | null {
  const match = HREF.exec(attrs)
  if (!match) return null
  const raw = (match[1] ?? match[2] ?? match[3] ?? '').trim()
  return raw && SAFE_HREF.test(raw) ? raw : null
}

/**
 * Deja solo etiquetas de la allowlist y descarta todos los atributos (salvo un
 * `href` con protocolo seguro en `<a>`). Lo que no está permitido pierde el
 * markup pero conserva el texto — nunca se pierde contenido del admin.
 *
 * No es un parser completo de HTML: asume el markup acotado que genera TipTap.
 * Es la última línea de defensa, no un permiso para aceptar HTML de terceros.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return ''

  return html.replace(DANGEROUS_BLOCK, '').replace(TAG, (match, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase()
    if (!ALLOWED_TAGS.has(name)) return ''
    if (match.startsWith('</')) return `</${name}>`
    if (name === 'a') {
      const href = safeHref(attrs)
      return href
        ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`
        : '<a>'
    }
    return `<${name}>`
  })
}

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
}

/** Texto plano del HTML — para metadatos, JSON-LD y resúmenes en tablas. */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(DANGEROUS_BLOCK, '')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)>/gi, ' ')
    .replace(/<(br|hr)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * TipTap nunca devuelve cadena vacía: un documento sin contenido es
 * `<p></p>`. Se normaliza a '' para que el campo se guarde realmente vacío.
 */
export function isRichTextEmpty(html: string): boolean {
  return stripHtml(html) === '' && !/<(hr|img)\b/i.test(html)
}

/** ¿El valor guardado es HTML del editor o texto plano heredado (Excel, seed)? */
export function isHtmlContent(value: string): boolean {
  return /<\/?[a-z][a-z0-9-]*(\s[^>]*)?>/i.test(value)
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Negrita/cursiva estilo Markdown dentro de una línea ya escapada. */
function inlineMarkdown(line: string): string {
  return line
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
}

/**
 * Convierte una descripción heredada (texto plano con marcas Markdown, como
 * las que se cargaron por Excel) al HTML que entiende el editor y la ficha.
 * El texto se escapa primero, así que el resultado es seguro de renderizar.
 */
export function plainTextToHtml(text: string): string {
  const normalized = escapeHtml(text.replace(/\r\n/g, '\n')).trim()
  if (!normalized) return ''

  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const heading = /^(#{2,3})\s+(.+)$/.exec(block)
      if (heading) {
        const level = heading[1].length
        return `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`
      }

      const lines = block.split('\n')
      if (lines.every((line) => /^\s*[-*•]\s+/.test(line))) {
        const items = lines
          .map((line) => `<li>${inlineMarkdown(line.replace(/^\s*[-*•]\s+/, ''))}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }

      return `<p>${lines.map(inlineMarkdown).join('<br>')}</p>`
    })
    .join('')
}

/** Descripción lista para renderizar, venga del editor o de una carga antigua. */
export function toRichHtml(value: string): string {
  return isHtmlContent(value) ? value : plainTextToHtml(value)
}
