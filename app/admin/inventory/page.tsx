import { StockAdjustControl } from '@/features/inventory/components/StockAdjustControl'
import type { ProductListItem, StockFilter } from '@/features/products/types'
import { countProducts, getProducts } from '@/features/products/queries/product.queries'
import { getInventoryStats } from '@/features/inventory/queries/inventory.queries'
import { AdminPagination } from '@/shared/components/admin/AdminPagination'
import { ADMIN_PER_PAGE } from '@/shared/lib/admin/pagination'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { StockBadge } from '@/features/inventory/components/StockBadge'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import Image from 'next/image'

type SerializedProduct = Omit<ProductListItem, 'price' | 'salePrice'> & {
  price: number
  salePrice: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_STRIPE: Record<string, string> = {
  'figuras-accion': 'stripe-fig',
  lego: 'stripe-lego',
  'modelos-escala': 'stripe-veh',
  anime: 'stripe-fig',
}

const VALID_FILTERS = new Set<StockFilter>(['all', 'low', 'out'])

const FILTER_TABS: { key: StockFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'low', label: 'Stock bajo' },
  { key: 'out', label: 'Agotados' },
]

const PER_PAGE = ADMIN_PER_PAGE

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return qs ? `/admin/inventory?${qs}` : '/admin/inventory'
}

interface PageProps {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>
}

// ---------------------------------------------------------------------------
// Columnas — definidas en el Server Component.
// Las render functions corren en el servidor; StockAdjustControl es la
// única isla cliente y se hidrata en el browser.
// ---------------------------------------------------------------------------

const columns: Column<SerializedProduct>[] = [
  {
    header: 'Producto',
    render: (p) => (
      <div className="flex items-center gap-3">
        {p.images[0]?.url ? (
          <Image
            src={p.images[0].url}
            alt={p.images[0].alt ?? p.name}
            width={42}
            height={42}
            className="w-10.5 h-10.5 object-cover shrink-0 border border-(--bd)"
          />
        ) : (
          <div
            className={`${CATEGORY_STRIPE[p.category.slug] ?? 'stripe-fig'} w-10.5 h-10.5 shrink-0`}
          />
        )}
        <div>
          <div className={cls.rowName}>{p.name}</div>
          <div className={cls.rowSub}>{p.brand.name}</div>
        </div>
      </div>
    ),
  },
  { header: 'SKU', className: cls.mono, render: (p) => p.sku },
  { header: 'Stock', render: (p) => <StockBadge s={p.inventory?.availableStock ?? 0} /> },
  {
    header: 'Valor',
    className: cls.valGold,
    render: (p) => `S/ ${((p.inventory?.availableStock ?? 0) * Number(p.price)).toFixed(2)}`,
  },
  {
    header: 'Ajustar inventario',
    render: (p) => (
      <StockAdjustControl
        productId={p.id}
        productName={p.name}
        stock={p.inventory?.availableStock ?? 0}
      />
    ),
  },
]

// ---------------------------------------------------------------------------
// Page — 100% Server Component
// ---------------------------------------------------------------------------

export default async function InventoryPage({ searchParams }: PageProps) {
  const { filter: rawFilter, q, page: rawPage } = await searchParams
  const stockFilter: StockFilter =
    rawFilter && VALID_FILTERS.has(rawFilter as StockFilter) ? (rawFilter as StockFilter) : 'all'
  const page = Math.max(1, Number(rawPage ?? 1))
  const currentQ = q ?? ''

  // Un COUNT por pestaña (respetando la búsqueda) — antes cada pestaña mostraba
  // el número de filas cargadas, que era el mismo para las tres.
  const [rawProducts, stats, tabCounts] = await Promise.all([
    getProducts({
      search: q,
      stockFilter,
      status: 'ALL',
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
    getInventoryStats(),
    Promise.all(
      FILTER_TABS.map((tab) => countProducts({ search: q, stockFilter: tab.key, status: 'ALL' })),
    ),
  ])

  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
  }))

  const total = tabCounts[FILTER_TABS.findIndex((t) => t.key === stockFilter)] ?? 0
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard label="Unidades totales" value={stats.totalUnits} valueClass="text-text" />
        <KpiCard
          label="Valor inventario"
          value={`S/ ${(stats.totalValue / 1000).toFixed(1)}K`}
          valueClass="text-(--gold)"
        />
        <KpiCard label="Stock bajo" value={stats.lowStockCount} valueClass="text-[#ffb84a]" />
        <KpiCard label="Agotados" value={stats.outOfStockCount} valueClass="text-[#ff6644]" />
      </div>

      {/* Búsqueda y tabs — GET navigation, sin estado cliente */}
      <div className="flex items-center gap-3.5 mb-5 flex-wrap">
        <ServerSearchForm
          placeholder="Buscar producto o SKU..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={stockFilter !== 'all' ? { filter: stockFilter } : {}}
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(({ key, label }, i) => (
            <a
              key={key}
              href={buildUrl({
                q: currentQ || undefined,
                filter: key !== 'all' ? key : undefined,
              })}
              className={cn(
                'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                key === stockFilter
                  ? 'bg-(--gold) border-(--gold) text-black'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {label}
              <span className="opacity-70 ml-1.5 font-sans normal-case tracking-normal text-[12px]">
                {tabCounts[i]}
              </span>
            </a>
          ))}
        </div>
        {currentQ && (
          <a
            href={buildUrl({ filter: stockFilter !== 'all' ? stockFilter : undefined })}
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}
      </div>

      {/* AdminTable — mismo componente que el resto del admin */}
      <AdminTable columns={columns} data={products} keyExtractor={(p) => p.id} />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PER_PAGE}
        className="mt-4"
        buildHref={(p) =>
          buildUrl({
            q: currentQ || undefined,
            filter: stockFilter !== 'all' ? stockFilter : undefined,
            page: String(p),
          })
        }
      />
    </div>
  )
}
