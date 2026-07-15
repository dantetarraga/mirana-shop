'use client'

import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin/admin-classes'
import { findBestMatch } from '@/features/products/lib/catalog-match'
import type { ImportProductRow } from '@/features/products/schemas/product.schema'
import { cn } from '@/shared/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle2, FileSpreadsheet, Star, Upload, X } from 'lucide-react'
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
  'precio oferta': 'salePrice',
  'sale price': 'salePrice',
  saleprice: 'salePrice',
  cantidad: 'stock',
  quantity: 'stock',
  stock: 'stock',
  marca: 'brand',
  brand: 'brand',
  categoria: 'cat',
  categoría: 'cat',
  category: 'cat',
  cat: 'cat',
  estado: 'status',
  status: 'status',
  destacado: 'featured',
  featured: 'featured',
  imagen: 'imageUrl',
  image: 'imageUrl',
  'imagen url': 'imageUrl',
  'image url': 'imageUrl',
  imageurl: 'imageUrl',
  'imagenes': 'imageUrl',
  'imagenes url': 'imageUrl',
  'images': 'imageUrl',
  'image urls': 'imageUrl',
  'imagenes separadas por |': 'imageUrl',
}

type StatusKey = 'AVAILABLE' | 'PREORDER' | 'SOLD_OUT' | 'COMING_SOON' | 'ARCHIVED'

const STATUS_MAP: Record<string, StatusKey> = {
  available: 'AVAILABLE',
  disponible: 'AVAILABLE',
  preorder: 'PREORDER',
  'pre-orden': 'PREORDER',
  'pre orden': 'PREORDER',
  soldout: 'SOLD_OUT',
  'sold out': 'SOLD_OUT',
  agotado: 'SOLD_OUT',
  comingsoon: 'COMING_SOON',
  'coming soon': 'COMING_SOON',
  proximamente: 'COMING_SOON',
  'próximamente': 'COMING_SOON',
  archived: 'ARCHIVED',
  archivado: 'ARCHIVED',
}

// Opción de catálogo (categoría o marca) contra la que se valida cada fila.
// Se acepta el nombre, el slug, o una variante cercana (tildes/mayúsculas/
// typos/abreviaciones) vía findBestMatch — ver catalog-match.ts.
interface CatalogOption {
  name: string
  slug: string
}

interface ExcelRow {
  sku: string
  name: string
  desc: string
  price: number
  salePrice: number
  stock: number
  brand: string
  cat: string
  status: StatusKey
  featured: boolean
  imageUrl: string
}

interface ParsedRow {
  row: number
  data: Partial<ExcelRow>
  errors: string[]
  warnings: string[]
  isNewCategory: boolean
  isNewBrand: boolean
}

interface Props {
  categories: CatalogOption[]
  brands: CatalogOption[]
  /** SKUs ya existentes — para anticipar en el preview cuáles filas crean vs. actualizan */
  existingSkus: string[]
  onClose: () => void
  onImport: (products: ImportProductRow[]) => void
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------
function parseSheet(
  workbook: XLSX.WorkBook,
  categories: CatalogOption[],
  brands: CatalogOption[],
): ParsedRow[] {
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
    const warnings: string[] = []
    let isNewCategory = false
    let isNewBrand = false

    if (!normalized.sku) errors.push('SKU requerido')
    if (!normalized.name) errors.push('Nombre requerido')

    const rawPrice = Number(normalized.price)
    if (isNaN(rawPrice) || rawPrice <= 0) {
      errors.push('Precio inválido')
      normalized.price = undefined
    } else {
      normalized.price = rawPrice
    }

    const rawStock = Number(normalized.stock)
    if (isNaN(rawStock) || rawStock < 0) {
      errors.push('Cantidad inválida')
      normalized.stock = undefined
    } else {
      normalized.stock = Math.floor(rawStock)
    }

    // Si no hay match cercano con una categoría/marca existente, no se bloquea
    // la fila: se importa creando una nueva con ese nombre (ver importProducts).
    const catRaw = String(normalized.cat ?? '').trim()
    if (!catRaw) {
      errors.push('Categoría requerida')
    } else {
      const matchedCat = findBestMatch(catRaw, categories)
      normalized.cat = matchedCat ? matchedCat.name : catRaw
      if (!matchedCat) {
        isNewCategory = true
        warnings.push(`Categoría nueva: se creará "${catRaw}"`)
      }
    }

    const brandRaw = String(normalized.brand ?? '').trim()
    if (!brandRaw) {
      errors.push('Marca requerida')
    } else {
      const matchedBrand = findBestMatch(brandRaw, brands)
      normalized.brand = matchedBrand ? matchedBrand.name : brandRaw
      if (!matchedBrand) {
        isNewBrand = true
        warnings.push(`Marca nueva: se creará "${brandRaw}"`)
      }
    }

    const rawSale = Number(normalized.salePrice)
    if (normalized.salePrice != null && normalized.salePrice !== ('' as unknown as number)) {
      if (isNaN(rawSale) || rawSale <= 0) {
        errors.push('Precio de oferta inválido')
        normalized.salePrice = undefined
      } else {
        normalized.salePrice = rawSale
      }
    } else {
      normalized.salePrice = undefined
    }

    const statusRaw = String(normalized.status ?? '')
      .toLowerCase()
      .trim()
    if (statusRaw) {
      const mappedStatus = STATUS_MAP[statusRaw]
      if (!mappedStatus) errors.push(`Estado desconocido: "${statusRaw}"`)
      else normalized.status = mappedStatus
    } else {
      normalized.status = 'AVAILABLE'
    }

    const featRaw = normalized.featured as unknown
    if (typeof featRaw === 'string') {
      const feat = featRaw.toLowerCase().trim()
      normalized.featured = feat === 'true' || feat === '1' || feat === 'si' || feat === 'sí'
    } else {
      normalized.featured = Boolean(featRaw)
    }

    if (normalized.imageUrl && typeof normalized.imageUrl === 'string') {
      const urls = String(normalized.imageUrl)
        .split('|')
        .map((u) => u.trim())
        .filter(Boolean)
      const invalidUrls = urls.filter((u) => {
        try {
          new URL(u)
          return false
        } catch {
          return true
        }
      })
      if (invalidUrls.length > 0) {
        errors.push(`URL de imagen inválida: ${invalidUrls.join(', ')}`)
      }
    }

    return { row: i + 2, data: normalized, errors, warnings, isNewCategory, isNewBrand }
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExcelImportDrawer({ categories, brands, existingSkus, onClose, onImport }: Props) {
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
      setRows(parseSheet(wb, categories, brands))
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
  const warningRows = validRows.filter((r) => r.warnings.length > 0)

  // Resumen de lo que va a ocurrir al confirmar — el usuario debe poder
  // anticipar el resultado antes de importar, no solo enterarse después.
  const existingSkuSet = new Set(existingSkus)
  const toUpdateCount = validRows.filter((r) => existingSkuSet.has(r.data.sku!)).length
  const toCreateCount = validRows.length - toUpdateCount
  const newCategoryNames = Array.from(
    new Set(validRows.filter((r) => r.isNewCategory).map((r) => r.data.cat!)),
  )
  const newBrandNames = Array.from(
    new Set(validRows.filter((r) => r.isNewBrand).map((r) => r.data.brand!)),
  )
  const uniqueErrors = Array.from(new Set(errorRows.flatMap((r) => r.errors)))

  const handleImport = () => {
    const products: ImportProductRow[] = validRows.map((r) => ({
      sku: r.data.sku!,
      name: r.data.name!,
      desc: r.data.desc ?? '',
      price: r.data.price!,
      salePrice: r.data.salePrice || undefined,
      stock: r.data.stock!,
      brand: r.data.brand!,
      cat: r.data.cat!,
      status: r.data.status ?? 'AVAILABLE',
      featured: r.data.featured ?? false,
      imageUrls: r.data.imageUrl
        ? String(r.data.imageUrl)
            .split('|')
            .map((u) => u.trim())
            .filter(Boolean)
        : [],
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
        <div className="px-5 sm:px-7 py-6 flex justify-between items-start sticky top-0 z-5 bg-surf border-b border-(--bd)">
          <div>
            <div className={cls.label}>Importar productos</div>
            <div className="font-display text-[26px] font-black tracking-[-0.5px]">Subir Excel</div>
          </div>
          <Button variant="icon" size="md" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="px-5 sm:px-7 pt-6 pb-10 flex flex-col gap-5 flex-1">
          {/* Columnas esperadas */}
          <div className="bg-card border border-(--bd) p-4">
            <div className={cn(cls.label, 'mb-2')}>Columnas requeridas</div>
            <div className="flex flex-wrap gap-2">
              {['SKU', 'Nombre', 'Precio', 'Cantidad', 'Categoria', 'Marca'].map(
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
            <div className={cn(cls.label, 'mb-2 mt-3')}>Columnas opcionales</div>
            <div className="flex flex-wrap gap-2">
              {['Descripcion', 'Precio Oferta', 'Estado', 'Destacado', 'URL Imagen'].map(
                (c) => (
                  <span
                    key={c}
                    className="font-mono text-[11px] bg-black/10 border border-(--bd) px-2 py-0.5 text-muted/70"
                  >
                    {c}
                  </span>
                ),
              )}
            </div>
            <p className="text-[12px] text-muted mt-2">
              Los encabezados aceptan variaciones en español o inglés. Categoría y Marca aceptan el
              nombre, el slug, o una variante cercana (tildes, mayúsculas, typos leves): si no
              coincide con ninguna existente se creará una nueva automáticamente. Soporta .xlsx,
              .xls y .csv.
            </p>
            <a
              href="/plantillas/plantilla-importar-productos.xlsx"
              download
              className="inline-flex items-center gap-1.5 text-[12px] text-(--gold) no-underline mt-2 hover:underline"
            >
              <FileSpreadsheet size={13} /> Descargar plantilla de ejemplo
            </a>
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
              'border-2 border-dashed p-6 sm:p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors',
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
              <div className="flex flex-wrap gap-3">
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
                {warningRows.length > 0 && (
                  <div className="flex-1 bg-card border border-(--bd) p-4 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-(--gold) shrink-0" />
                    <div>
                      <div className="font-display font-black text-[22px] text-(--gold)">
                        {warningRows.length}
                      </div>
                      <div className="text-[11px] text-muted uppercase tracking-widest">
                        Categoría/marca nueva
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla preview */}
              <div className="border border-(--bd) overflow-hidden">
                <div className="overflow-x-auto max-h-85 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        {['Fila', 'SKU', 'Nombre', 'Cat.', 'Precio', 'Oferta', 'Estado', 'Dest.', 'Cant.', 'Marca'].map((h) => (
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
                          className={cn(
                            r.errors.length
                              ? 'bg-red-950/20'
                              : r.warnings.length
                                ? 'bg-(--gold)/5'
                                : 'hover:bg-white/2',
                          )}
                        >
                          <td className={cn(cls.td, cls.mono)}>{r.row}</td>
                          <td className={cn(cls.td, cls.mono)}>{r.data.sku ?? '—'}</td>
                          <td className={cn(cls.td, 'max-w-30 truncate')}>
                            {r.data.name ?? '—'}
                          </td>
                          <td className={cn(cls.td, cls.mono)}>{r.data.cat ?? '—'}</td>
                          <td className={cn(cls.td, cls.valGold)}>
                            {typeof r.data.price === 'number' ? `S/ ${r.data.price.toFixed(2)}` : '—'}
                          </td>
                          <td className={cn(cls.td, cls.valGold)}>
                            {typeof r.data.salePrice === 'number'
                              ? `S/ ${r.data.salePrice.toFixed(2)}`
                              : '—'}
                          </td>
                          <td className={cn(cls.td, 'text-[11px]')}>{r.data.status ?? '—'}</td>
                          <td className={cn(cls.td, 'text-center')}>
                            {r.data.featured ? (
                              <Star size={12} className="inline text-(--gold)" fill="currentColor" />
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className={cls.td}>{r.data.stock ?? '—'}</td>
                          <td className={cn(cls.td, 'max-w-20 truncate')}>{r.data.brand ?? '—'}</td>
                          <td className={cls.td}>
                            {r.errors.length > 0 ? (
                              <span className="text-[11px] text-red-400">
                                {r.errors.join(' · ')}
                              </span>
                            ) : r.warnings.length > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-(--gold)"
                                title={r.warnings.join(' · ')}
                              >
                                <AlertTriangle size={12} />
                                {r.warnings.join(' · ')}
                              </span>
                            ) : (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen antes de importar — qué va a pasar exactamente al confirmar */}
              <div className="bg-card border border-(--bd) p-4 flex flex-col gap-2.5">
                <div className={cls.label}>Resumen antes de importar</div>
                <ul className="flex flex-col gap-2 text-[13px]">
                  {toCreateCount > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      {toCreateCount} producto{toCreateCount !== 1 ? 's' : ''} nuevo
                      {toCreateCount !== 1 ? 's' : ''} se crearán
                    </li>
                  )}
                  {toUpdateCount > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      {toUpdateCount} producto{toUpdateCount !== 1 ? 's' : ''} existente
                      {toUpdateCount !== 1 ? 's' : ''} (mismo SKU) se actualizará
                      {toUpdateCount !== 1 ? 'n' : ''}
                    </li>
                  )}
                  {newCategoryNames.length > 0 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-(--gold) shrink-0 mt-0.5" />
                      <span>
                        Categoría{newCategoryNames.length !== 1 ? 's' : ''} nueva
                        {newCategoryNames.length !== 1 ? 's' : ''} a crear:{' '}
                        <span className="text-(--gold)">{newCategoryNames.join(', ')}</span>
                      </span>
                    </li>
                  )}
                  {newBrandNames.length > 0 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-(--gold) shrink-0 mt-0.5" />
                      <span>
                        Marca{newBrandNames.length !== 1 ? 's' : ''} nueva
                        {newBrandNames.length !== 1 ? 's' : ''} a crear:{' '}
                        <span className="text-(--gold)">{newBrandNames.join(', ')}</span>
                      </span>
                    </li>
                  )}
                  {errorRows.length > 0 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <span>
                        {errorRows.length} fila{errorRows.length !== 1 ? 's' : ''} con errores no se
                        importará{errorRows.length !== 1 ? 'n' : ''} — corrígelas y vuelve a subir el
                        archivo:
                        <br />
                        <span className="text-red-400/80">{uniqueErrors.join(' · ')}</span>
                      </span>
                    </li>
                  )}
                  {validRows.length === 0 && errorRows.length === 0 && (
                    <li className="text-muted">No hay filas para importar.</li>
                  )}
                </ul>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2.5">
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
