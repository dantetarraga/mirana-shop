'use client'

import {
  SpreadsheetImportDrawer,
  type SpreadsheetColumn,
} from '@/shared/components/admin/SpreadsheetImportDrawer'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// EntityImportDrawer — drawer genérico de carga masiva por Excel para
// entidades simples de campos string (marcas, categorías). Envuelve a
// SpreadsheetImportDrawer y resuelve el mapeo de encabezados (aliases) y los
// requeridos; las reglas específicas de cada entidad entran por `validateRow`.
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

function parseRows(
  raw: Record<string, unknown>[],
  fields: ImportField[],
  validateRow?: (data: ImportedRow) => string[],
): ParsedRow[] {
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
  const columns: SpreadsheetColumn<ParsedRow>[] = fields.map((f) => ({
    key: f.key,
    header: f.label,
    className: cn('max-w-40 truncate', f.mono && cls.mono),
    cell: (r) => r.data[f.key] || '—',
  }))

  return (
    <SpreadsheetImportDrawer<ParsedRow>
      title={title}
      requiredColumns={fields.filter((f) => f.required).map((f) => f.label)}
      optionalColumns={fields.filter((f) => !f.required).map((f) => f.label)}
      hint="Los encabezados aceptan variaciones en español o inglés. Soporta .xlsx, .xls y .csv."
      templateHref={templateHref}
      parseRows={(raw) => parseRows(raw, fields, validateRow)}
      columns={columns}
      importLabel={(count) => `Importar ${count} ${count === 1 ? entitySingular : entityPlural}`}
      footer={({ errorRows }) =>
        errorRows.length > 0 && (
          <p className="text-[12px] text-danger">
            Las {errorRows.length} fila(s) con errores no se importarán. Corrige el archivo y vuelve
            a subirlo.
          </p>
        )
      }
      onClose={onClose}
      onImport={(validRows) => onImport(validRows.map((r) => r.data))}
    />
  )
}
