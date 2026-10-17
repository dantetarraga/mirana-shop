// ---------------------------------------------------------------------------
// Utilidades para el contenido HTML que produce el RichTextEditor (TipTap).
// El HTML se guarda tal cual en BD y se pinta con dangerouslySetInnerHTML, así
// que se sanea SIEMPRE antes de persistirlo y otra vez al renderizarlo (ver
// sanitizeRichText / toRichHtml).
// ---------------------------------------------------------------------------

import sanitizeHtml from 'sanitize-html'

/** Etiquetas que puede emitir el editor (TipTap StarterKit) y que se conservan al sanear. */
const ALLOWED_TAGS = [
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
]

/** Elementos que se eliminan enteros — etiqueta y contenido. */
const DANGEROUS_BLOCK = /<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi

const DROP_WITH_CONTENT = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'template',
  'noscript',
  'textarea',
  'option',
  'select',
  'svg',
  'math',
  'title',
  'xmp',
  'noembed',
  'noframes',
]

// Relativas (`/ruta`, `#ancla`) o con protocolo seguro. `//host` (protocol-
// relative) se rechaza: saldría del sitio sin que el admin lo vea en el editor.
const SAFE_HREF = /^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  allowedClasses: {},
  allowedStyles: {},
  disallowedTagsMode: 'discard',
  nonTextTags: DROP_WITH_CONTENT,
  // Se fuerzan target/rel en los enlaces válidos; uno con href inseguro (o sin
  // href) queda como `<a>` pelado, que no navega.
  transformTags: {
    a: (_tagName, attribs): sanitizeHtml.Tag => {
      const href = (attribs.href ?? '').trim()
      if (!href || !SAFE_HREF.test(href)) return { tagName: 'a', attribs: {} }
      return {
        tagName: 'a',
        attribs: { href, target: '_blank', rel: 'noopener noreferrer' },
      }
    },
  },
}

/**
 * Deja solo etiquetas de la allowlist y descarta todos los atributos (salvo un
 * `href` con protocolo seguro en `<a>`). Lo que no está permitido pierde el
 * markup pero conserva el texto — nunca se pierde contenido del admin.
 *
 * Usa un parser real de HTML (htmlparser2 vía sanitize-html): el saneador
 * anterior por regex se evadía con etiquetas anidadas (`<<x>img onerror=…>`),
 * porque al quitar la etiqueta interna se recomponía la externa. Se aplica al
 * guardar y otra vez al renderizar.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return ''
  return sanitizeHtml(html, SANITIZE_OPTIONS)
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
  return isHtmlContent(value) ? sanitizeRichText(value) : plainTextToHtml(value)
}
