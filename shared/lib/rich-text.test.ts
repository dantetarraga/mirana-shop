import { sanitizeRichText, toRichHtml } from '@/shared/lib/rich-text'
import { describe, expect, it } from 'vitest'

/** Ningún resultado saneado puede contener una etiqueta o atributo ejecutable. */
function expectInert(html: string) {
  expect(html).not.toMatch(/<\s*(img|script|svg|iframe|object|embed|style|math|template)\b/i)
  expect(html).not.toMatch(/<[^>]*\son\w+\s*=/i)
  expect(html).not.toMatch(/(href|src)\s*=\s*["']?\s*(javascript|data|vbscript):/i)
}

describe('rich text sanitization', () => {
  it('removes executable blocks and unsafe attributes', () => {
    const value = '<p onclick="alert(1)">Hola</p><script>alert(1)</script>'
    expect(sanitizeRichText(value)).toBe('<p>Hola</p>')
  })

  it('sanitizes legacy HTML again when rendering', () => {
    expect(toRichHtml('<a href="javascript:alert(1)">Abrir</a>')).toBe('<a>Abrir</a>')
  })

  it('keeps the markup the editor produces', () => {
    const value =
      '<h2>Título</h2><p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s> <code>e</code></p>' +
      '<ul><li><p>uno</p></li></ul><ol><li>dos</li></ol><blockquote><p>cita</p></blockquote>' +
      '<pre><code>x</code></pre><hr>'
    expect(sanitizeRichText(value)).toBe(value.replace('<hr>', '<hr />'))
  })

  it('keeps safe links forcing target/rel and drops the rest of attributes', () => {
    expect(
      sanitizeRichText('<a href="https://mirana.pe" class="x" target="_self" rel="nofollow">ok</a>'),
    ).toBe('<a href="https://mirana.pe" target="_blank" rel="noopener noreferrer">ok</a>')
    expect(sanitizeRichText('<a href="/catalogo">ok</a>')).toBe(
      '<a href="/catalogo" target="_blank" rel="noopener noreferrer">ok</a>',
    )
    expect(sanitizeRichText('<a href="//evil.example">x</a>')).toBe('<a>x</a>')
    expect(sanitizeRichText('<a href=" JaVaScRiPt:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitizeRichText('<a href="data:text/html,<script>alert(1)</script>">x</a>')).toBe('<a>x</a>')
  })

  it.each([
    '<<x>img src=x onerror=alert(1)>',
    '<<x>>img src=x onerror=alert(1)>',
    '<<<x>x>img src=x onerror=alert(1)>',
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<im<b>g src=x onerror=alert(1)>',
    '<img src=x onerror=alert(1)//',
    '<svg><script>alert(1)</script></svg>',
    '<svg/onload=alert(1)>',
    '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<p title="</p><img src=x onerror=alert(1)>">x</p>',
    '<!--<img src=x onerror=alert(1)>-->',
    '<![CDATA[<img src=x onerror=alert(1)>]]>',
    '<style><img src=x onerror=alert(1)></style>',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
    '<a href="jav&#x09;ascript:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
  ])('neutraliza el payload %s', (payload) => {
    expectInert(sanitizeRichText(payload))
    expectInert(toRichHtml(payload))
  })
})
