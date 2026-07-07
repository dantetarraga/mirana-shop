import { CategoryDonut } from '@/features/dashboard/components/charts/CategoryDonut'
import { OrdersBarChart } from '@/features/dashboard/components/charts/OrdersBarChart'
import { RevenueAreaChart } from '@/features/dashboard/components/charts/RevenueAreaChart'
import { Sparkline } from '@/features/dashboard/components/charts/Sparkline'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import {
  ORDER_STATUS_CFG,
  PIE_COLORS,
  getCategoryStripe,
  orderCustomer,
  type SerializedOrder,
} from '@/features/dashboard/lib/dashboard-constants'
import type { ProductListItem } from '@/features/products/types'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn, formatDate } from '@/shared/lib/utils'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Versión serializable de ProductListItem — Decimals ya convertidos a number
type SerializedProduct = Omit<ProductListItem, 'price' | 'salePrice'> & {
  price: number
  salePrice: number | null
}

interface OrderStats {
  total: number
  pending: number
  shipped: number
  delivered: number
  cancelled: number
  revenue: number
}

interface InventoryStats {
  totalUnits: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}

interface DashboardViewProps {
  orderStats: OrderStats
  topProducts: SerializedProduct[]
  inventoryStats: InventoryStats
  userCount: number
  recentOrders: SerializedOrder[]
  revenueByMonth: { m: string; v: number }[]
  ordersByDay: { d: string; v: number }[]
  ordersByCategory: { name: string; value: number }[]
}

export function DashboardView({
  orderStats,
  topProducts,
  inventoryStats,
  userCount,
  recentOrders,
  revenueByMonth,
  ordersByDay,
  ordersByCategory,
}: DashboardViewProps) {
  const revenueNum = orderStats.revenue
  // Sparklines: extraemos los últimos 14 puntos de los datos reales
  const sparkRevenue = revenueByMonth.slice(-14).map((r) => r.v)
  const sparkOrders = ordersByDay.map((r) => r.v)
  const topByStock = [...topProducts]
    .sort((a, b) => (b.inventory?.availableStock ?? 0) - (a.inventory?.availableStock ?? 0))
    .slice(0, 5)
  const maxStock = Math.max(...topByStock.map((p) => p.inventory?.availableStock ?? 0), 1)

  const kpis = [
    {
      label: 'Ingresos (total)',
      value: `S/ ${(revenueNum / 1000).toFixed(1)}K`,
      delta: 'acumulado sin cancelados',
      data: sparkRevenue.length ? sparkRevenue : [0],
      color: '#00c8ff',
    },
    {
      label: 'Pedidos',
      value: String(orderStats.total),
      delta: `${orderStats.pending} pendientes`,
      data: sparkOrders.length ? sparkOrders : [0],
      color: '#8b7cff',
    },
    {
      label: 'Clientes',
      value: String(userCount),
      delta: 'Total registrados',
      data: [userCount],
      color: '#c77cff',
    },
    {
      label: 'Inventario',
      value: `S/ ${(inventoryStats.totalValue / 1000).toFixed(1)}K`,
      delta: `${inventoryStats.lowStockCount} en stock bajo`,
      data: [inventoryStats.totalValue / 1000],
      color: '#3fcf7f',
    },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value}>
            <div className="flex justify-between items-center mb-2.5 min-w-0">
              <span className="font-display font-extrabold text-[12px] text-[#3fcf7f] truncate">
                {k.delta}
              </span>
            </div>
            <Sparkline data={k.data} color={k.color} w={160} h={40} />
          </KpiCard>
        ))}
      </div>

      {/* Área + Donut */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className={cls.panel}>
          <PanelHeader
            label="Ingresos"
            title="Ventas últimos 12 meses"
            mb="mb-5"
            side={
              <div className="font-display text-[22px] font-black text-right">
                S/ {(revenueNum / 1000).toFixed(1)}K
                <span className="block text-[10px] font-medium tracking-[1px] uppercase text-muted">
                  total acumulado
                </span>
              </div>
            }
          />
          <RevenueAreaChart data={revenueByMonth} />
        </div>

        <div className={cls.panel}>
          <PanelHeader label="Distribución" title="Ventas por categoría" mb="mb-5" />
          <CategoryDonut data={ordersByCategory} />
          <div className="flex flex-col gap-2.5 mt-1">
            {ordersByCategory.length === 0 ? (
              <p className="text-[12px] text-muted text-center py-2">Sin datos de pedidos aún</p>
            ) : (
              ordersByCategory.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-[13px] flex-1">{d.name}</span>
                  <span className="font-display font-extrabold text-[16px]">{d.value}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Barras + Top productos */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className={cls.panel}>
          <PanelHeader
            label="Rendimiento"
            title="Pedidos últimos 14 días"
            mb="mb-5"
            side={
              <div className="font-display text-[22px] font-black text-right">
                {orderStats.total}
                <span className="block text-[10px] font-medium tracking-[1px] uppercase text-muted">
                  total pedidos
                </span>
              </div>
            }
          />
          <OrdersBarChart data={ordersByDay} />
        </div>

        <div className={cls.panel}>
          <PanelHeader
            label="Con más stock"
            title="Top productos"
            side={
              <Link
                href="/admin/products"
                className="font-display inline-flex items-center hover:text-(--gold) transition-colors duration-200 text-[14px] font-bold no-underline tracking-[1px] text-muted"
              >
                Ver todos
                <ArrowRight size={14} className="inline-block ml-1" strokeWidth={3} />
              </Link>
            }
          />
          <div className="flex flex-col gap-3.5">
            {topByStock.map((p, i) => {
              const stock = p.inventory?.availableStock ?? 0
              return (
                <div key={p.id} className="flex items-center gap-3.5">
                  <span className="font-display font-black text-[18px] w-4.5 text-muted">
                    {i + 1}
                  </span>
                  {p.images[0]?.url ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].alt ?? p.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover shrink-0 border border-(--bd)"
                    />
                  ) : (
                    <div className={`${getCategoryStripe(p.category.slug)} w-10 h-10 shrink-0`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        cls.rowName,
                        'text-[15px] whitespace-nowrap overflow-hidden text-ellipsis mb-1.25',
                      )}
                    >
                      {p.name}
                    </div>
                    <div className="h-1.25 overflow-hidden bg-(--sub)">
                      <span
                        className="block h-full bg-(--gold)"
                        style={{ width: `${(stock / maxStock) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="font-display font-black text-[18px] text-right">
                    {stock}
                    <span className="block text-[9px] font-medium tracking-[1px] uppercase text-muted">
                      uds
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className={cls.panelTable}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-(--bd)">
          <div>
            <div className={cls.label}>Actividad reciente</div>
            <div className="font-display text-[20px] font-black uppercase tracking-tight">
              Últimos pedidos
            </div>
          </div>
          <Link
            href="/admin/orders"
            className="font-display inline-flex items-center transition-colors duration-200 text-[13px] font-bold no-underline tracking-[1px] uppercase text-muted hover:text-(--gold)"
          >
            Ver todos
            <ArrowRight size={14} className="inline-block ml-1" strokeWidth={3} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-150">
            <thead>
              <tr>
                {['Código', 'Cliente', 'Productos', 'Total', 'Estado', 'Fecha'].map((h) => (
                  <th key={h} className={cls.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted text-[13px]">
                    Sin pedidos registrados aún
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const cfg = ORDER_STATUS_CFG[o.status] ?? { label: o.status, color: 'text-muted' }
                  return (
                    <tr key={o.id} className="hover:bg-white/2 transition-colors">
                      <td className={cn(cls.td, cls.monoGold)}>{o.code}</td>
                      <td className={cls.td}>
                        <div className="text-[14px]">{orderCustomer(o)}</div>
                        {o.shipping?.district && (
                          <div className="text-[11px] text-muted">{o.shipping.district}</div>
                        )}
                      </td>
                      <td className={cn(cls.td, cls.mono)}>
                        {o._count.items} {o._count.items === 1 ? 'ítem' : 'ítems'}
                      </td>
                      <td className={cn(cls.td, cls.valGold)}>S/ {o.total.toFixed(2)}</td>
                      <td className={cls.td}>
                        <span className={cn('text-[12px] font-semibold tracking-wide', cfg.color)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className={cn(cls.td, cls.mono, 'text-muted')}>
                        {formatDate(new Date(o.createdAt), 'd MMM yyyy')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
