import { StockAdjustControl } from '@/features/inventory/components/StockAdjustControl'
import type { ProductListItem } from '@/modules/catalog/repositories/product.repo'
import { productRepo, type StockFilter } from '@/modules/catalog/repositories/product.repo'
import { inventoryRepo } from '@/modules/inventory/repositories/inventory.repo'
import { AdminTable, type Column } from '@/shared/components/AdminTable'
import { KpiCard } from '@/shared/components/KpiCard'
import { StockBadge } from '@/shared/components/StockBadge'
import { cls } from '@/shared/lib/admin-classes'
import { cn } from '@/shared/lib/utils'

type SerializedProduct = Omit<ProductListItem, 'price' | 'compareAtPrice' | 'salePrice'> & {
  price: number
  compareAtPrice: number | null
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

const FILTER_TABS: { key: StockFilter; label: string; href: string }[] = [
  { key: 'all', label: 'Todos', href: '/admin/inventory' },
  { key: 'low', label: 'Stock bajo', href: '/admin/inventory?filter=low' },
  { key: 'out', label: 'Agotados', href: '/admin/inventory?filter=out' },
]

interface PageProps {
  searchParams: Promise<{ filter?: string }>
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
        <div
          className={`${CATEGORY_STRIPE[p.category.slug] ?? 'stripe-fig'} w-10.5 h-10.5 shrink-0`}
        />
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
  const { filter: rawFilter } = await searchParams
  const stockFilter: StockFilter =
    rawFilter && VALID_FILTERS.has(rawFilter as StockFilter) ? (rawFilter as StockFilter) : 'all'

  const [rawProducts, stats] = await Promise.all([
    productRepo.findMany({ stockFilter, status: undefined, take: 500 }),
    inventoryRepo.getStats(),
  ])

  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
  }))

  return (
    <div className="px-8 pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Unidades totales" value={stats.totalUnits} valueClass="text-text" />
        <KpiCard
          label="Valor inventario"
          value={`S/ ${(stats.totalValue / 1000).toFixed(1)}K`}
          valueClass="text-(--gold)"
        />
        <KpiCard label="Stock bajo" value={stats.lowStockCount} valueClass="text-[#ffb84a]" />
        <KpiCard label="Agotados" value={stats.outOfStockCount} valueClass="text-[#ff6644]" />
      </div>

      {/* Tabs — GET navigation, sin estado cliente */}
      <div className="flex gap-1.5 mb-5">
        {FILTER_TABS.map(({ key, label, href }) => (
          <a
            key={key}
            href={href}
            className={cn(
              'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
              key === stockFilter
                ? 'bg-(--gold) border-(--gold) text-black'
                : 'border-(--bd) text-muted hover:text-text',
            )}
          >
            {label}
            <span className="opacity-70 ml-1.5 font-sans normal-case tracking-normal text-[12px]">
              {products.length}
            </span>
          </a>
        ))}
      </div>

      {/* AdminTable — mismo componente que el resto del admin */}
      <AdminTable columns={columns} data={products} keyExtractor={(p) => p.id} />
    </div>
  )
}
