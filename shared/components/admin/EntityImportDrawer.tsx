'use client'

import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import * as XLSX from 'xlsx'

// ---------------------------------------------------------------------------
// EntityImportDrawer — drawer genérico de carga masiva por Excel para
// entidades simples de campos string (marcas, categorías). El drawer resuelve
// el mapeo de encabezados (aliases), los requeridos y el preview; las reglas
// específicas de cada entidad entran por `validateRow`.
// ---------------------------------------------------------------------------

export interface ImportField {
  key: string
  /** Etiqueta visible en chips y en el preview */
  label: string
  /** Variantes de encabezado aceptadas, en minúsculas y sin espacios extra */
  aliases: string[]
  required?: boolean
  mono?: boolean
}

export type ImportedRow = Record<string, string>

interface ParsedRow {
  row: number
  data: ImportedRow
  errors: string[]
}

interface EntityImportDrawerProps {
  /** Título del drawer, p. ej. "Importar marcas" */
  title: string
  /** Texto del botón: "Importar 3 marca(s)" */
  entitySingular: string
  entityPlural: string
  fields: ImportField[]
  /** Validaciones extra por fila; retorna mensajes de error */
  validateRow?: (data: ImportedRow) => string[]
  /** Ruta pública de la plantilla descargable (en /public) */
  templateHref?: string
  onClose: () => void
  onImport: (rows: ImportedRow[]) => void
}

function parseSheet(
  workbook: XLSX.WorkBook,
  fields: ImportField[],
  validateRow?: (data: ImportedRow) => string[],
): ParsedRow[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const aliasMap = new Map<string, string>()
  for (const field of fields) {
    aliasMap.set(field.key.toLowerCase(), field.key)
    for (const alias of field.aliases) aliasMap.set(alias.toLowerCase(), field.key)
  }

  return raw.map((rawRow, i) => {
    const data: ImportedRow = Object.fromEntries(fields.map((f) => [f.key, '']))

    for (const [key, val] of Object.entries(rawRow)) {
      const fieldKey = aliasMap.get(key.toLowerCase().trim())
      if (fieldKey) data[fieldKey] = String(val).trim()
    }

    const errors: string[] = []
    for (const field of fields) {
      if (field.required && !data[field.key]) errors.push(`${field.label} requerido`)
    }
    if (validateRow) errors.push(...validateRow(data))

    return { row: i + 2, data, errors }
  })
}

export function EntityImportDrawer({
  title,
  entitySingular,
  entityPlural,
  fields,
  validateRow,
  templateHref,
  onClose,
  onImport,
}: EntityImportDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [fileName, setFileName] = useState('')

  const processFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      setRows(parseSheet(wb, fields, validateRow))
    }
    reader.readAsArrayBuffer(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const validRows = rows?.filter((r) => r.errors.length === 0) ?? []
  const errorRows = rows?.filter((r) => r.errors.length > 0) ?? []

  const requiredFields = fields.filter((f) => f.required)
  const optionalFields = fields.filter((f) => !f.required)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-175 max-w-full h-screen overflow-y-auto bg-surf border-l border-(--bd) flex flex-col"
      >
        {/* Header */}
        <div className="px-7 py-6 flex justify-between items-start sticky top-0 z-5 bg-surf border-b border-(--bd)">
          <div>
            <div className={cls.label}>{title}</div>
            <div className="font-display text-[26px] font-black tracking-[-0.5px]">Subir Excel</div>
          </div>
          <Button variant="icon" size="md" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="px-7 pt-6 pb-10 flex flex-col gap-5 flex-1">
          {/* Columnas esperadas */}
          <div className="bg-card border border-(--bd) p-4">
            <div className={cn(cls.label, 'mb-2')}>Columnas requeridas</div>
            <div className="flex flex-wrap gap-2">
              {requiredFields.map((f) => (
                <span
                  key={f.key}
                  className="font-mono text-[11px] bg-black/30 border border-(--bd) px-2 py-0.5 text-muted"
                >
                  {f.label}
                </span>
              ))}
            </div>
            {optionalFields.length > 0 && (
              <>
                <div className={cn(cls.label, 'mb-2 mt-3')}>Columnas opcionales</div>
                <div className="flex flex-wrap gap-2">
                  {optionalFields.map((f) => (
                    <span
                      key={f.key}
                      className="font-mono text-[11px] bg-black/10 border border-(--bd) px-2 py-0.5 text-muted/70"
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </>
            )}
            <p className="text-[12px] text-muted mt-2">
              Los encabezados aceptan variaciones en español o inglés. Soporta .xlsx, .xls y .csv.
            </p>
            {templateHref && (
              <a
                href={templateHref}
                download
                className="inline-flex items-center gap-1.5 text-[12px] text-(--gold) no-underline mt-2 hover:underline"
              >
                <FileSpreadsheet size={13} /> Descargar plantilla de ejemplo
              </a>
            )}
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors',
              dragging ? 'border-(--gold) bg-(--gold)/5' : 'border-(--bd) hover:border-(--gold)/50',
            )}
          >
            <FileSpreadsheet size={36} className="text-muted" />
            <div className="text-center">
              <div className="font-display font-bold text-[15px]">
                {fileName ? fileName : 'Arrastra tu archivo o haz clic para seleccionar'}
              </div>
              {!fileName && <div className="text-[12px] text-muted mt-1">.xlsx · .xls · .csv</div>}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) processFile(f)
              }}
            />
          </div>

          {/* Resultados del parse */}
          {rows !== null && (
            <>
              {/* Resumen */}
              <div className="flex gap-3">
                <div className="flex-1 bg-card border border-(--bd) p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-display font-black text-[22px] text-emerald-400">
                      {validRows.length}
                    </div>
                    <div className="text-[11px] text-muted uppercase tracking-widest">Válidos</div>
                  </div>
                </div>
                <div className="flex-1 bg-card border border-(--bd) p-4 flex items-center gap-3">
                  <AlertCircle
                    size={20}
                    className={cn('shrink-0', errorRows.length ? 'text-red-400' : 'text-muted')}
                  />
                  <div>
                    <div
                      className={cn(
                        'font-display font-black text-[22px]',
                        errorRows.length ? 'text-red-400' : 'text-muted',
                      )}
                    >
                      {errorRows.length}
                    </div>
                    <div className="text-[11px] text-muted uppercase tracking-widest">
                      Con errores
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla preview */}
              <div className="border border-(--bd) overflow-hidden">
                <div className="overflow-x-auto max-h-85 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className={cn(cls.th, 'whitespace-nowrap')}>Fila</th>
                        {fields.map((f) => (
                          <th key={f.key} className={cn(cls.th, 'whitespace-nowrap')}>
                            {f.label}
                          </th>
                        ))}
                        <th className={cls.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.row}
                          className={cn(r.errors.length ? 'bg-red-950/20' : 'hover:bg-white/2')}
                        >
                          <td className={cn(cls.td, cls.mono)}>{r.row}</td>
                          {fields.map((f) => (
                            <td
                              key={f.key}
                              className={cn(cls.td, 'max-w-40 truncate', f.mono && cls.mono)}
                            >
                              {r.data[f.key] || '—'}
                            </td>
                          ))}
                          <td className={cls.td}>
                            {r.errors.length === 0 ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : (
                              <span className="text-[11px] text-red-400">
                                {r.errors.join(' · ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2.5">
                <Button
                  variant="accent"
                  size="md"
                  full
                  onClick={() => onImport(validRows.map((r) => r.data))}
                  disabled={validRows.length === 0}
                >
                  <Upload size={15} />
                  Importar {validRows.length}{' '}
                  {validRows.length === 1 ? entitySingular : entityPlural}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  full
                  onClick={() => {
                    setRows(null)
                    setFileName('')
                  }}
                >
                  Limpiar
                </Button>
              </div>

              {errorRows.length > 0 && (
                <p className="text-[12px] text-red-400">
                  Las {errorRows.length} fila(s) con errores no se importarán. Corrige el archivo y
                  vuelve a subirlo.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
