'use client'

import { findBestMatch } from '@/features/products/lib/catalog-match'
import type { ImportProductRow } from '@/features/products/schemas/product.schema'
import {
  SpreadsheetImportDrawer,
  type SpreadsheetColumn,
  type SpreadsheetImportContext,
} from '@/shared/components/admin/SpreadsheetImportDrawer'
import { cls } from '@/shared/lib/admin/admin-classes'
import { formatCurrency } from '@/shared/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle2, Star } from 'lucide-react'

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
  imagenes: 'imageUrl',
  'imagenes url': 'imageUrl',
  images: 'imageUrl',
  'image urls': 'imageUrl',
  'imagenes separadas por |': 'imageUrl',
  // Preventa parcial — columnas opcionales
  'preventa parcial': 'allowPartialPreorder',
  'partial preorder': 'allowPartialPreorder',
  adelanto: 'depositPercent',
  'adelanto %': 'depositPercent',
  'deposit percent': 'depositPercent',
  'entrega estimada': 'estimatedArrival',
  'fecha estimada': 'estimatedArrival',
  'estimated arrival': 'estimatedArrival',
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
  próximamente: 'COMING_SOON',
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
  allowPartialPreorder: boolean
  depositPercent: number
  estimatedArrival: Date
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
function parseRows(
  raw: Record<string, unknown>[],
  categories: CatalogOption[],
  brands: CatalogOption[],
): ParsedRow[] {
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

    const partialRaw = normalized.allowPartialPreorder as unknown
    if (typeof partialRaw === 'string') {
      const p = partialRaw.toLowerCase().trim()
      normalized.allowPartialPreorder = p === 'true' || p === '1' || p === 'si' || p === 'sí'
    } else {
      normalized.allowPartialPreorder = Boolean(partialRaw)
    }
    // La preventa parcial sin estado Preventa no hace nada (canPartialPreorder
    // exige PREORDER) — se avisa en vez de importar algo que no va a funcionar.
    if (normalized.allowPartialPreorder && normalized.status !== 'PREORDER') {
      normalized.allowPartialPreorder = false
      warnings.push('Preventa parcial ignorada: el estado no es Preventa')
    }

    const depositRaw = String(normalized.depositPercent ?? '').trim()
    if (depositRaw) {
      const pct = Number(depositRaw)
      if (isNaN(pct) || pct < 1 || pct > 100) {
        errors.push('Adelanto inválido: debe estar entre 1 y 100')
        normalized.depositPercent = undefined
      } else {
        normalized.depositPercent = Math.round(pct)
      }
    } else {
      normalized.depositPercent = undefined
    }

    const arrivalRaw = normalized.estimatedArrival as unknown
    if (arrivalRaw instanceof Date) {
      normalized.estimatedArrival = arrivalRaw
    } else if (String(arrivalRaw ?? '').trim()) {
      const parsedDate = new Date(String(arrivalRaw))
      if (isNaN(parsedDate.getTime())) {
        errors.push('Fecha de entrega estimada inválida')
        normalized.estimatedArrival = undefined
      } else {
        normalized.estimatedArrival = parsedDate
      }
    } else {
      normalized.estimatedArrival = undefined
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
// Preview y resumen
// ---------------------------------------------------------------------------
const COLUMNS: SpreadsheetColumn<ParsedRow>[] = [
  { key: 'sku', header: 'SKU', className: cls.mono, cell: (r) => r.data.sku ?? '—' },
  {
    key: 'name',
    header: 'Nombre',
    className: 'max-w-30 truncate',
    cell: (r) => r.data.name ?? '—',
  },
  { key: 'cat', header: 'Cat.', className: cls.mono, cell: (r) => r.data.cat ?? '—' },
  {
    key: 'price',
    header: 'Precio',
    className: cls.valGold,
    cell: (r) => (typeof r.data.price === 'number' ? formatCurrency(r.data.price) : '—'),
  },
  {
    key: 'salePrice',
    header: 'Oferta',
    className: cls.valGold,
    cell: (r) => (typeof r.data.salePrice === 'number' ? formatCurrency(r.data.salePrice) : '—'),
  },
  { key: 'status', header: 'Estado', className: 'text-[11px]', cell: (r) => r.data.status ?? '—' },
  {
    key: 'featured',
    header: 'Dest.',
    className: 'text-center',
    cell: (r) =>
      r.data.featured ? (
        <Star
          size={12}
          className="inline text-accent-ink"
          fill="currentColor"
          aria-label="Destacado"
        />
      ) : (
        '—'
      ),
  },
  { key: 'stock', header: 'Cant.', cell: (r) => r.data.stock ?? '—' },
  {
    key: 'brand',
    header: 'Marca',
    className: 'max-w-20 truncate',
    cell: (r) => r.data.brand ?? '—',
  },
]

function plural(count: number, suffix = 's') {
  return count !== 1 ? suffix : ''
}

/** Qué va a pasar exactamente al confirmar — anticipar el resultado, no enterarse después. */
function ImportSummary({
  validRows,
  errorRows,
  existingSkus,
}: SpreadsheetImportContext<ParsedRow> & { existingSkus: string[] }) {
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

  return (
    <div className="bg-card border border-(--bd) p-4 flex flex-col gap-2.5">
      <div className={cls.label}>Resumen antes de importar</div>
      <ul className="flex flex-col gap-2 text-[13px]">
        {toCreateCount > 0 && (
          <li className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            {toCreateCount} producto{plural(toCreateCount)} nuevo{plural(toCreateCount)} se crearán
          </li>
        )}
        {toUpdateCount > 0 && (
          <li className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            {toUpdateCount} producto{plural(toUpdateCount)} existente{plural(toUpdateCount)} (mismo
            SKU) se actualizará{plural(toUpdateCount, 'n')}
          </li>
        )}
        {newCategoryNames.length > 0 && (
          <li className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-accent-ink shrink-0 mt-0.5" />
            <span>
              Categoría{plural(newCategoryNames.length)} nueva{plural(newCategoryNames.length)} a
              crear: <span className="text-accent-ink">{newCategoryNames.join(', ')}</span>
            </span>
          </li>
        )}
        {newBrandNames.length > 0 && (
          <li className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-accent-ink shrink-0 mt-0.5" />
            <span>
              Marca{plural(newBrandNames.length)} nueva{plural(newBrandNames.length)} a crear:{' '}
              <span className="text-accent-ink">{newBrandNames.join(', ')}</span>
            </span>
          </li>
        )}
        {errorRows.length > 0 && (
          <li className="flex items-start gap-2">
            <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
            <span>
              {errorRows.length} fila{plural(errorRows.length)} con errores no se importará
              {plural(errorRows.length, 'n')} — corrígelas y vuelve a subir el archivo:
              <br />
              <span className="text-danger">{uniqueErrors.join(' · ')}</span>
            </span>
          </li>
        )}
        {validRows.length === 0 && errorRows.length === 0 && (
          <li className="text-muted">No hay filas para importar.</li>
        )}
      </ul>
    </div>
  )
}

function toImportProduct(r: ParsedRow): ImportProductRow {
  return {
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
    allowPartialPreorder: r.data.allowPartialPreorder ?? false,
    depositPercent: r.data.depositPercent ?? null,
    estimatedArrival: r.data.estimatedArrival ?? null,
    imageUrls: r.data.imageUrl
      ? String(r.data.imageUrl)
          .split('|')
          .map((u) => u.trim())
          .filter(Boolean)
      : [],
  }
}

// ---------------------------------------------------------------------------
// Component — envoltorio de SpreadsheetImportDrawer con las reglas de producto
// ---------------------------------------------------------------------------
export function ExcelImportDrawer({ categories, brands, existingSkus, onClose, onImport }: Props) {
  return (
    <SpreadsheetImportDrawer<ParsedRow>
      title="Importar productos"
      requiredColumns={['SKU', 'Nombre', 'Precio', 'Cantidad', 'Categoria', 'Marca']}
      optionalColumns={['Descripcion', 'Precio Oferta', 'Estado', 'Destacado', 'URL Imagen']}
      hint={
        <>
          Los encabezados aceptan variaciones en español o inglés. Categoría y Marca aceptan el
          nombre, el slug, o una variante cercana (tildes, mayúsculas, typos leves): si no coincide
          con ninguna existente se creará una nueva automáticamente. Soporta .xlsx, .xls y .csv.
        </>
      }
      templateHref="/plantillas/plantilla-importar-productos.xlsx"
      // "Entrega estimada" es una fecha: sin cellDates llegaría como número de serie.
      cellDates
      parseRows={(raw) => parseRows(raw, categories, brands)}
      columns={COLUMNS}
      warningLabel="Categoría/marca nueva"
      importLabel={(count) => `Importar ${count} producto${plural(count)}`}
      summary={(ctx) => <ImportSummary {...ctx} existingSkus={existingSkus} />}
      onClose={onClose}
      onImport={(validRows) => {
        onImport(validRows.map(toImportProduct))
        onClose()
      }}
    />
  )
}
