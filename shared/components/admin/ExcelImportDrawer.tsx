'use client'

import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin-classes'
import type { ImportProductRow } from '@/shared/lib/schemas'
import { cn } from '@/shared/lib/utils'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import * as XLSX from 'xlsx'

// ---------------------------------------------------------------------------
// Column mapping — acepta variaciones en español e inglés, case-insensitive
// ---------------------------------------------------------------------------
const COL_ALIASES: Record<string, keyof ExcelRow> = {
  sku: 'sku',
  nombre: 'name',
  name: 'name',
  descripcion: 'desc',
  descripción: 'desc',
  description: 'desc',
  desc: 'desc',
  precio: 'price',
  price: 'price',
  cantidad: 'stock',
  quantity: 'stock',
  stock: 'stock',
  marca: 'brand',
  brand: 'brand',
  categoria: 'cat',
  categoría: 'cat',
  category: 'cat',
  cat: 'cat',
}

type CatKey = 'figures' | 'lego' | 'vehicles'

const CAT_MAP: Record<string, CatKey> = {
  figures: 'figures',
  figuras: 'figures',
  figura: 'figures',
  'figura de acción': 'figures',
  'figura de accion': 'figures',
  accion: 'figures',
  acción: 'figures',
  'figuras de accion': 'figures',
  lego: 'lego',
  'set lego': 'lego',
  legos: 'lego',
  vehicles: 'vehicles',
  vehiculos: 'vehicles',
  vehículos: 'vehicles',
  vehículo: 'vehicles',
  vehiculo: 'vehicles',
  modelos: 'vehicles',
  escala: 'vehicles',
  'modelo escala': 'vehicles',
  'modelos a escala': 'vehicles',
}

interface ExcelRow {
  sku: string
  name: string
  desc: string
  price: number
  stock: number
  brand: string
  cat: CatKey
}

interface ParsedRow {
  row: number
  data: Partial<ExcelRow>
  errors: string[]
}

interface Props {
  onClose: () => void
  onImport: (products: ImportProductRow[]) => void
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------
function parseSheet(workbook: XLSX.WorkBook): ParsedRow[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return raw.map((rawRow, i) => {
    const normalized: Partial<ExcelRow> = {}

    for (const [key, val] of Object.entries(rawRow)) {
      const alias = COL_ALIASES[key.toLowerCase().trim()]
      if (!alias) continue
      ;(normalized as Record<string, unknown>)[alias] = val
    }

    const errors: string[] = []

    if (!normalized.sku) errors.push('SKU requerido')
    if (!normalized.name) errors.push('Nombre requerido')

    const rawPrice = Number(normalized.price)
    if (isNaN(rawPrice) || rawPrice <= 0) errors.push('Precio inválido')
    else normalized.price = rawPrice

    const rawStock = Number(normalized.stock)
    if (isNaN(rawStock) || rawStock < 0) errors.push('Cantidad inválida')
    else normalized.stock = Math.floor(rawStock)

    const catRaw = String(normalized.cat ?? '')
      .toLowerCase()
      .trim()
    const mappedCat = CAT_MAP[catRaw]
    if (!mappedCat) errors.push(`Categoría desconocida: "${catRaw}"`)
    else normalized.cat = mappedCat

    return { row: i + 2, data: normalized, errors }
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExcelImportDrawer({ onClose, onImport }: Props) {
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
      setRows(parseSheet(wb))
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

  const handleImport = () => {
    const products: ImportProductRow[] = validRows.map((r) => ({
      sku: r.data.sku!,
      name: r.data.name!,
      desc: r.data.desc ?? '',
      price: r.data.price!,
      stock: r.data.stock!,
      brand: r.data.brand ?? '',
      cat: r.data.cat!,
    }))
    onImport(products)
    onClose()
  }

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
            <div className={cls.label}>Importar productos</div>
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
              {['SKU', 'Nombre', 'Descripcion', 'Precio', 'Cantidad', 'Marca', 'Categoria'].map(
                (c) => (
                  <span
                    key={c}
                    className="font-mono text-[11px] bg-black/30 border border-(--bd) px-2 py-0.5 text-muted"
                  >
                    {c}
                  </span>
                ),
              )}
            </div>
            <p className="text-[12px] text-muted mt-2">
              Los encabezados aceptan variaciones en español o inglés. Soporta .xlsx, .xls y .csv.
            </p>
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
                        {['Fila', 'SKU', 'Nombre', 'Cat.', 'Precio', 'Qty', 'Marca'].map((h) => (
                          <th key={h} className={cn(cls.th, 'whitespace-nowrap')}>
                            {h}
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
                          <td className={cn(cls.td, cls.mono)}>{r.data.sku ?? '—'}</td>
                          <td className={cn(cls.td, 'max-w-37.5 truncate')}>
                            {r.data.name ?? '—'}
                          </td>
                          <td className={cn(cls.td, cls.mono)}>{r.data.cat ?? '—'}</td>
                          <td className={cn(cls.td, cls.valGold)}>
                            {r.data.price != null ? `S/ ${r.data.price.toFixed(2)}` : '—'}
                          </td>
                          <td className={cls.td}>{r.data.stock ?? '—'}</td>
                          <td className={cn(cls.td, 'max-w-25 truncate')}>{r.data.brand ?? '—'}</td>
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
                  onClick={handleImport}
                  disabled={validRows.length === 0}
                >
                  <Upload size={15} />
                  Importar {validRows.length} producto{validRows.length !== 1 ? 's' : ''}
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
