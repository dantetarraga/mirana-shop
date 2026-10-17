import {
  complaintSheetSections,
  formatLimaDate,
  formatLimaDateTime,
  providerRows,
  SHEET_FOOTNOTES,
  STORE_DISPLAY_NAME,
  type ComplaintSheetData,
  type ProviderInfo,
} from '@/features/complaints/lib/complaint-sheet'

// ---------------------------------------------------------------------------
// Hoja de Reclamación imprimible (Anexo I). Se muestra tras registrar la hoja
// y es lo único que se imprime con "Imprimir / Guardar hoja" (ver PRINT_CSS).
// ---------------------------------------------------------------------------

export const COMPLAINT_SHEET_ID = 'complaint-sheet'

/** Al imprimir solo se ve la hoja: oculta navbar, footer y el resto del sitio. */
export const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden !important; }
  #${COMPLAINT_SHEET_ID}, #${COMPLAINT_SHEET_ID} * { visibility: visible !important; }
  #${COMPLAINT_SHEET_ID} {
    position: absolute; left: 0; top: 0; width: 100%;
    background: #fff !important; color: #000 !important; border: 0 !important;
    padding: 0 !important; box-shadow: none !important;
  }
  #${COMPLAINT_SHEET_ID} * { color: #000 !important; background: transparent !important; border-color: #999 !important; }
}
`

export function ComplaintSheet({
  data,
  provider,
}: {
  data: ComplaintSheetData
  provider: ProviderInfo
}) {
  const sections = complaintSheetSections(data)
  const header = [
    { label: 'Nombre comercial', value: STORE_DISPLAY_NAME },
    ...providerRows(provider),
  ]

  return (
    <article
      id={COMPLAINT_SHEET_ID}
      aria-label={`Hoja de reclamación ${data.code}`}
      className="bg-card border border-(--bd) p-5 sm:p-6 text-left text-[13px]"
    >
      <header className="border-b border-(--bd) pb-4 mb-4">
        <h2 className="font-display font-black uppercase text-[18px] tracking-tight">
          Libro de Reclamaciones — Hoja de Reclamación
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3">
          {header.map((r) => (
            <div key={r.label} className="flex gap-2">
              <dt className="text-muted shrink-0">{r.label}:</dt>
              <dd className="font-semibold">{r.value}</dd>
            </div>
          ))}
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Hoja Nº:</dt>
            <dd className="font-mono font-semibold">{data.code}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Fecha:</dt>
            <dd className="font-semibold">{formatLimaDateTime(data.createdAt)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Respuesta hasta:</dt>
            <dd className="font-semibold">{formatLimaDate(data.dueAt)}</dd>
          </div>
        </dl>
      </header>

      {sections.map((s) => (
        <section key={s.title} className="mb-4">
          <h3 className="text-[11px] tracking-[2px] uppercase text-accent-ink font-bold mb-2">
            {s.title}
          </h3>
          <dl className="grid grid-cols-1 gap-1.5">
            {s.rows.map((r) => (
              <div key={r.label} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-3">
                <dt className="text-muted">{r.label}</dt>
                <dd className={r.multiline ? 'whitespace-pre-wrap wrap-break-word' : 'wrap-break-word'}>
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <p className="text-[12px] text-muted mt-2">
        El consumidor declaró que la información proporcionada es verdadera y autorizó el
        tratamiento de sus datos personales para la atención de esta hoja.
      </p>
      <ul className="mt-3 flex flex-col gap-1 text-[11px] text-muted">
        {SHEET_FOOTNOTES.map((n) => (
          <li key={n}>* {n}</li>
        ))}
      </ul>
    </article>
  )
}
