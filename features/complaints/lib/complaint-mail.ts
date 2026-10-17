import 'server-only'

import {
  complaintSheetSections,
  formatLimaDate,
  formatLimaDateTime,
  providerRows,
  SHEET_FOOTNOTES,
  STORE_DISPLAY_NAME,
  type ComplaintSheetData,
  type ProviderInfo,
  type SheetRow,
} from '@/features/complaints/lib/complaint-sheet'
import { escapeHtml, type MailMessage } from '@/shared/lib/mail'

// ---------------------------------------------------------------------------
// Correos del Libro de Reclamaciones:
// - Constancia: copia íntegra de la hoja enviada al consumidor al registrarla.
// - Respuesta: la respuesta del proveedor dentro del plazo legal.
// ---------------------------------------------------------------------------

const esc = (v: string) => escapeHtml(v).replace(/\n/g, '<br>')

function rowsHtml(rows: SheetRow[]): string {
  return rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 10px;border:1px solid #ddd;background:#f7f7f7;width:34%;vertical-align:top;font-weight:600">${escapeHtml(r.label)}</td>` +
        `<td style="padding:6px 10px;border:1px solid #ddd;vertical-align:top">${esc(r.value)}</td></tr>`,
    )
    .join('')
}

function sectionHtml(title: string, rows: SheetRow[]): string {
  return (
    `<h3 style="font-size:14px;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px">${escapeHtml(title)}</h3>` +
    `<table style="border-collapse:collapse;width:100%;font-size:13px">${rowsHtml(rows)}</table>`
  )
}

function rowsText(rows: SheetRow[]): string {
  return rows.map((r) => `${r.label}: ${r.value}`).join('\n')
}

function layout(body: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif"><div style="max-width:680px;margin:0 auto">${body}</div></body></html>`
}

function headerRows(c: ComplaintSheetData): SheetRow[] {
  return [
    { label: 'Hoja de reclamación Nº', value: c.code },
    { label: 'Fecha de registro', value: `${formatLimaDateTime(c.createdAt)} (hora de Lima)` },
    { label: 'Plazo máximo de respuesta', value: formatLimaDate(c.dueAt) },
  ]
}

export function buildConsumerConstanciaMail(
  c: ComplaintSheetData,
  provider: ProviderInfo,
): MailMessage {
  const sections = complaintSheetSections(c)
  const provRows = providerRows(provider)
  const head = headerRows(c)

  const html = layout(
    `<h1 style="font-size:20px;margin:0 0 4px">Libro de Reclamaciones — Hoja de Reclamación</h1>` +
      `<p style="font-size:13px;color:#555;margin:0 0 16px">Constancia de registro. Conserva este correo: es tu copia de la hoja.</p>` +
      sectionHtml('Datos del proveedor', [{ label: 'Nombre comercial', value: STORE_DISPLAY_NAME }, ...provRows]) +
      sectionHtml('Hoja', head) +
      sections.map((s) => sectionHtml(s.title, s.rows)).join('') +
      `<p style="font-size:12px;color:#555;margin-top:20px">El consumidor declaró que la información proporcionada es verdadera y autorizó el tratamiento de sus datos personales para la atención de esta hoja.</p>` +
      SHEET_FOOTNOTES.map((n) => `<p style="font-size:12px;color:#555;margin:6px 0">* ${escapeHtml(n)}</p>`).join(''),
  )

  const text = [
    'LIBRO DE RECLAMACIONES — HOJA DE RECLAMACIÓN',
    'Constancia de registro. Conserva este correo: es tu copia de la hoja.',
    '',
    'DATOS DEL PROVEEDOR',
    `Nombre comercial: ${STORE_DISPLAY_NAME}`,
    rowsText(provRows),
    '',
    rowsText(head),
    ...sections.flatMap((s) => ['', s.title.toUpperCase(), rowsText(s.rows)]),
    '',
    'El consumidor declaró que la información proporcionada es verdadera y autorizó el tratamiento de sus datos personales para la atención de esta hoja.',
    ...SHEET_FOOTNOTES.map((n) => `* ${n}`),
  ].join('\n')

  return {
    to: c.email,
    subject: `Constancia de tu ${c.type === 'QUEJA' ? 'queja' : 'reclamo'} ${c.code} — ${STORE_DISPLAY_NAME}`,
    html,
    text,
  }
}

export function buildResponseMail(
  c: ComplaintSheetData,
  provider: ProviderInfo,
  response: { body: string; providerActions?: string | null; respondedAt: Date },
): MailMessage {
  const provRows = providerRows(provider)
  const answerRows: SheetRow[] = [
    { label: 'Fecha de respuesta', value: `${formatLimaDateTime(response.respondedAt)} (hora de Lima)` },
    { label: 'Respuesta', value: response.body, multiline: true },
  ]
  if (response.providerActions) {
    answerRows.push({
      label: 'Observaciones y acciones adoptadas por el proveedor',
      value: response.providerActions,
      multiline: true,
    })
  }
  const summary: SheetRow[] = [
    { label: 'Hoja de reclamación Nº', value: c.code },
    { label: 'Fecha de registro', value: formatLimaDateTime(c.createdAt) },
    { label: 'Detalle', value: c.detail, multiline: true },
    { label: 'Pedido', value: c.request, multiline: true },
  ]

  const html = layout(
    `<h1 style="font-size:20px;margin:0 0 4px">Respuesta a tu ${c.type === 'QUEJA' ? 'queja' : 'reclamo'} ${escapeHtml(c.code)}</h1>` +
      `<p style="font-size:13px;color:#555;margin:0 0 16px">Hola ${escapeHtml(c.fullName)}, esta es la respuesta del proveedor a tu hoja del Libro de Reclamaciones.</p>` +
      sectionHtml('Respuesta del proveedor', answerRows) +
      sectionHtml('Tu hoja', summary) +
      sectionHtml('Datos del proveedor', [{ label: 'Nombre comercial', value: STORE_DISPLAY_NAME }, ...provRows]) +
      `<p style="font-size:12px;color:#555;margin-top:20px">* ${escapeHtml(SHEET_FOOTNOTES[0])}</p>`,
  )

  const text = [
    `RESPUESTA A TU ${c.type === 'QUEJA' ? 'QUEJA' : 'RECLAMO'} ${c.code}`,
    '',
    rowsText(answerRows),
    '',
    'TU HOJA',
    rowsText(summary),
    '',
    'DATOS DEL PROVEEDOR',
    `Nombre comercial: ${STORE_DISPLAY_NAME}`,
    rowsText(provRows),
    '',
    `* ${SHEET_FOOTNOTES[0]}`,
  ].join('\n')

  return {
    to: c.email,
    subject: `Respuesta a tu ${c.type === 'QUEJA' ? 'queja' : 'reclamo'} ${c.code} — ${STORE_DISPLAY_NAME}`,
    html,
    text,
  }
}
