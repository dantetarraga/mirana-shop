'use client'

import { adjustStock } from '@/features/inventory/actions/inventory.actions'
import type { ProductListItem, StockFilter } from '@/features/products/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { StockBadge } from '@/features/inventory/components/StockBadge'
import { Button } from '@/shared/components/ui/Button'
import { useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Tipos serializados
// ---------------------------------------------------------------------------

type SerializedProduct = Omit<ProductListItem, 'price'> & {
  price: number
}

function getCategoryStripe(slug: string): string {
  const map: Record<string, string> = {
    'figuras-accion': 'stripe-fig',
    lego: 'stripe-lego',
    'modelos-escala': 'stripe-veh',
    anime: 'stripe-fig',
  }
  return map[slug] ?? 'stripe-fig'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InventoryStats {
  totalUnits: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}

interface InventoryClientProps {
  initialProducts: SerializedProduct[]
  initialStats: InventoryStats
  currentFilter: StockFilter
}

const FILTER_TABS: { key: StockFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'low', label: 'Stock bajo' },
  { key: 'out', label: 'Agotados' },
]

// ---------------------------------------------------------------------------
// Component — sin filter/find/reduce client-side
// ---------------------------------------------------------------------------

export function InventoryClient({
  initialProducts,
  initialStats,
  currentFilter,
}: InventoryClientProps) {
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts)
  const { isPending, run } = useServerAction()

  const adjust = (p: SerializedProduct, next: number) => {
    if (next < 0) return
    run(() => adjustStock({ productId: p.id, newStock: next }), {
      successMsg: `Stock de "${p.name}" → ${next}`,
      onSuccess: (data) => {
        setProducts((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, inventory: { availableStock: data.newStock } } : x,
          ),
        )
      },
    })
  }

  const columns = useMemo<Column<SerializedProduct>[]>(
    () => [
      {
        header: 'Producto',
        render: (p) => (
          <div className="flex items-center gap-3">
            <div className={`${getCategoryStripe(p.category.slug)} w-10.5 h-10.5`} />
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
        render: (p) => `S/ ${((p.inventory?.availableStock ?? 0) * p.price).toFixed(2)}`,
      },
      {
        header: 'Ajustar inventario',
        render: (p) => {
          const stock = p.inventory?.availableStock ?? 0
          return (
            <div className="flex gap-1.5 items-center">
              <Button
                variant="icon"
                size="sm"
                onClick={() => adjust(p, Math.max(0, stock - 1))}
                disabled={isPending}
              >
                <Minus size={14} />
              </Button>
              <input
                type="number"
                value={stock}
                min="0"
                onChange={(e) => adjust(p, Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14.5 text-center font-display font-extrabold text-[15px] p-1.5 bg-surf border border-(--bd) text-text"
                disabled={isPending}
              />
              <Button
                variant="icon"
                size="sm"
                onClick={() => adjust(p, stock + 1)}
                disabled={isPending}
              >
                <Plus size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjust(p, stock + 50)}
                className="ml-2"
                disabled={isPending}
              >
                +50
              </Button>
            </div>
          )
        },
      },
    ],
    [isPending],
  ) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      {/* KPIs — vienen del servidor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard label="Unidades totales" value={initialStats.totalUnits} valueClass="text-text" />
        <KpiCard
          label="Valor inventario"
          value={`S/ ${(initialStats.totalValue / 1000).toFixed(1)}K`}
          valueClass="text-(--gold)"
        />
        <KpiCard
          label="Stock bajo"
          value={initialStats.lowStockCount}
          valueClass="text-[#ffb84a]"
        />
        <KpiCard
          label="Agotados"
          value={initialStats.outOfStockCount}
          valueClass="text-[#ff6644]"
        />
      </div>

      {/* Tabs server-side — navegación GET */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {FILTER_TABS.map(({ key, label }) => {
          const isActive = key === currentFilter
          return (
            <a
              key={key}
              href={key === 'all' ? '/admin/inventory' : `/admin/inventory?filter=${key}`}
              className={cn(
                'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                isActive
                  ? 'bg-(--gold) border-(--gold) text-black'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {label}{' '}
              <span className="opacity-70 ml-1 font-sans normal-case tracking-normal text-[12px]">
                {products.length}
              </span>
            </a>
          )
        })}
      </div>

      <AdminTable columns={columns} data={products} keyExtractor={(p) => p.id} />
    </div>
  )
}
