'use client'

import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { Spinner } from '@/shared/components/ui/Spinner'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// SpreadsheetImportDrawer — base común de las cargas masivas por Excel/CSV.
// Resuelve lo que no depende de la entidad: semántica de diálogo (vía
// AdminDrawer: focus trap, Escape, aria-modal), dropzone + selector de archivo,
// lectura del libro con `xlsx` cargado bajo demanda, tarjetas de resumen,
// tabla de preview y acciones. Qué columnas existen, cómo se valida cada fila
// y qué se envía al importar lo decide quien lo usa (`parseRows`, `columns`,
// `onImport`).
// ---------------------------------------------------------------------------

/** Fila ya interpretada. `row` es el número de fila en la hoja (encabezado = 1). */
export interface SpreadsheetParsedRow {
  row: number
  errors: string[]
  warnings?: string[]
}

export interface SpreadsheetColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export interface SpreadsheetImportContext<T> {
  rows: T[]
  validRows: T[]
  errorRows: T[]
  warningRows: T[]
}

interface SpreadsheetImportDrawerProps<T extends SpreadsheetParsedRow> {
  /** Rótulo superior del drawer, p. ej. "Importar marcas" */
  title: string
  /** Chips de columnas esperadas */
  requiredColumns: string[]
  optionalColumns?: string[]
  /** Texto de ayuda bajo los chips */
  hint: ReactNode
  /** Ruta pública de la plantilla descargable (en /public) */
  templateHref?: string
  /**
   * `cellDates`: las fechas de Excel llegan como `Date` y no como número de
   * serie (ej. 46477). Solo hace falta si alguna columna es una fecha.
   */
  cellDates?: boolean
  /** Interpreta las filas crudas de la primera hoja (claves = encabezados). */
  parseRows: (raw: Record<string, unknown>[]) => T[]
  columns: SpreadsheetColumn<T>[]
  /** Etiqueta de la tarjeta de advertencias; sin ella no se muestra la tarjeta. */
  warningLabel?: string
  /** Texto del botón principal según la cantidad de filas válidas. */
  importLabel: (validCount: number) => string
  /** Bloque entre la tabla y las acciones (p. ej. "Resumen antes de importar"). */
  summary?: (ctx: SpreadsheetImportContext<T>) => ReactNode
  /** Bloque bajo las acciones (p. ej. aviso de filas descartadas). */
  footer?: (ctx: SpreadsheetImportContext<T>) => ReactNode
  onClose: () => void
  onImport: (validRows: T[]) => void
}

function ColumnChips({ columns, muted }: { columns: string[]; muted?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {columns.map((c) => (
        <span
          key={c}
          className={cn(
            'font-mono text-[11px] bg-hover-tint border border-(--bd) px-2 py-0.5',
            muted ? 'text-muted/70' : 'text-muted',
          )}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function SummaryCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode
  value: number
  label: string
  tone: string
}) {
  return (
    <div className="flex-1 bg-card border border-(--bd) p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className={cn('font-display font-black text-[22px]', tone)}>{value}</div>
        <div className="text-[11px] text-muted uppercase tracking-widest">{label}</div>
      </div>
    </div>
  )
}

export function SpreadsheetImportDrawer<T extends SpreadsheetParsedRow>({
  title,
  requiredColumns,
  optionalColumns = [],
  hint,
  templateHref,
  cellDates = false,
  parseRows,
  columns,
  warningLabel,
  importLabel,
  summary,
  footer,
  onClose,
  onImport,
}: SpreadsheetImportDrawerProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Cada lectura toma un id: si el usuario suelta otro archivo antes de que
  // termine la anterior, el resultado viejo se descarta.
  const readIdRef = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [rows, setRows] = useState<T[] | null>(null)
  const [fileName, setFileName] = useState('')

  const processFile = async (file: File) => {
    const readId = ++readIdRef.current
    setFileName(file.name)
    setReadError(null)
    setReading(true)
    try {
      // `xlsx` pesa cientos de KB: se descarga solo cuando hay un archivo que leer.
      const [XLSX, buffer] = await Promise.all([import('xlsx'), file.arrayBuffer()])
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const raw = sheet
        ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
        : []
      if (readId !== readIdRef.current) return
      setRows(parseRows(raw))
    } catch {
      if (readId !== readIdRef.current) return
      setRows(null)
      setReadError('No se pudo leer el archivo. Verifica que sea un .xlsx, .xls o .csv válido.')
    } finally {
      if (readId === readIdRef.current) setReading(false)
    }
  }

  // Función normal y no useCallback: se pasa a un elemento DOM (memorizarla no
  // ahorra nada) y con deps [] capturaría el `processFile` del primer render,
  // es decir, las props (catálogo/campos) de cuando se abrió el drawer.
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  const reset = () => {
    readIdRef.current++
    setRows(null)
    setFileName('')
    setReadError(null)
    setReading(false)
    // Permite volver a elegir el mismo archivo tras limpiar.
    if (inputRef.current) inputRef.current.value = ''
  }

  const validRows = rows?.filter((r) => r.errors.length === 0) ?? []
  const errorRows = rows?.filter((r) => r.errors.length > 0) ?? []
  const warningRows = validRows.filter((r) => (r.warnings?.length ?? 0) > 0)
  const ctx: SpreadsheetImportContext<T> = { rows: rows ?? [], validRows, errorRows, warningRows }

  return (
    <AdminDrawer title="Subir Excel" sub={title} onClose={onClose} size="lg">
      {/* Columnas esperadas */}
      <div className="bg-card border border-(--bd) p-4">
        <div className={cn(cls.label, 'mb-2')}>Columnas requeridas</div>
        <ColumnChips columns={requiredColumns} />
        {optionalColumns.length > 0 && (
          <>
            <div className={cn(cls.label, 'mb-2 mt-3')}>Columnas opcionales</div>
            <ColumnChips columns={optionalColumns} muted />
          </>
        )}
        <p className="text-[12px] text-muted mt-2">{hint}</p>
        {templateHref && (
          <a
            href={templateHref}
            download
            className="inline-flex items-center gap-1.5 text-[12px] text-accent-ink no-underline mt-2 hover:underline"
          >
            <FileSpreadsheet size={13} /> Descargar plantilla de ejemplo
          </a>
        )}
      </div>

      {/* Dropzone — botón real para que funcione con teclado */}
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        aria-busy={reading}
        className={cn(
          'w-full border-2 border-dashed p-6 sm:p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors',
          dragging ? 'border-(--gold) bg-(--gold)/5' : 'border-(--bd) hover:border-(--gold)/50',
        )}
      >
        {reading ? (
          <Spinner size={36} className="text-muted" />
        ) : (
          <FileSpreadsheet size={36} className="text-muted" />
        )}
        <span className="text-center">
          <span className="block font-display font-bold text-[15px]">
            {reading
              ? 'Leyendo archivo…'
              : fileName || 'Arrastra tu archivo o haz clic para seleccionar'}
          </span>
          {!fileName && (
            <span className="block text-[12px] text-muted mt-1">.xlsx · .xls · .csv</span>
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        aria-label="Seleccionar archivo de Excel o CSV"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void processFile(f)
        }}
      />

      {readError && (
        <p role="alert" className="text-[12px] text-danger flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0" />
          {readError}
        </p>
      )}

      {/* Resultados del parse */}
      {rows !== null && (
        <>
          {/* Resumen */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <SummaryCard
              icon={<CheckCircle2 size={20} className="text-success shrink-0" />}
              value={validRows.length}
              label="Válidos"
              tone="text-success"
            />
            <SummaryCard
              icon={
                <AlertCircle
                  size={20}
                  className={cn('shrink-0', errorRows.length ? 'text-danger' : 'text-muted')}
                />
              }
              value={errorRows.length}
              label="Con errores"
              tone={errorRows.length ? 'text-danger' : 'text-muted'}
            />
            {warningLabel && warningRows.length > 0 && (
              <SummaryCard
                icon={<AlertTriangle size={20} className="text-accent-ink shrink-0" />}
                value={warningRows.length}
                label={warningLabel}
                tone="text-accent-ink"
              />
            )}
          </div>

          {/* Tabla preview */}
          <div className="border border-(--bd) overflow-hidden">
            <div className="overflow-x-auto max-h-85 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className={cn(cls.th, 'whitespace-nowrap')}>Fila</th>
                    {columns.map((c) => (
                      <th key={c.key} className={cn(cls.th, 'whitespace-nowrap')}>
                        {c.header}
                      </th>
                    ))}
                    <th className={cls.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const warnings = r.warnings ?? []
                    return (
                      <tr
                        key={r.row}
                        className={cn(
                          r.errors.length
                            ? 'bg-danger/10'
                            : warnings.length
                              ? 'bg-(--gold)/5'
                              : 'hover:bg-hover-tint',
                        )}
                      >
                        <td className={cn(cls.td, cls.mono)}>{r.row}</td>
                        {columns.map((c) => (
                          <td key={c.key} className={cn(cls.td, c.className)}>
                            {c.cell(r)}
                          </td>
                        ))}
                        <td className={cls.td}>
                          {r.errors.length > 0 ? (
                            <span className="text-[11px] text-danger">{r.errors.join(' · ')}</span>
                          ) : warnings.length > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-accent-ink"
                              title={warnings.join(' · ')}
                            >
                              <AlertTriangle size={12} />
                              {warnings.join(' · ')}
                            </span>
                          ) : (
                            <CheckCircle2 size={14} className="text-success" aria-label="Válida" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {summary?.(ctx)}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="accent"
              size="md"
              full
              onClick={() => onImport(validRows)}
              disabled={validRows.length === 0}
            >
              <Upload size={15} />
              {importLabel(validRows.length)}
            </Button>
            <Button variant="outline" size="md" full onClick={reset}>
              Limpiar
            </Button>
          </div>

          {footer?.(ctx)}
        </>
      )}
    </AdminDrawer>
  )
}
