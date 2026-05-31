'use client'

import { CAT_STRIPE } from '@/features/products/data/products'
import { AdminTable, type Column } from '@/shared/components/AdminTable'
import { KpiCard } from '@/shared/components/KpiCard'
import { PanelHeader } from '@/shared/components/PanelHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { cls } from '@/shared/lib/admin-classes'
import { ORDER_STATUS, fmt, fmtDate, orderTotal } from '@/shared/lib/admin-constants'
import { CATEGORY_PIE, ORDERS_DAILY, PIE_COLORS, SALES_DATA, SPARK } from '@/shared/lib/admin-data'
import { cn } from '@/shared/lib/utils'
import { useAdminStore } from '@/shared/stores/admin.store'
import type { Order } from '@/shared/types/admin-mock.types'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
function Sparkline({
  data,
  color = '#58aaff',
  w = 160,
  h = 40,
}: {
  data: number[]
  color?: string
  w?: number
  h?: number
}) {
  const chartData = data.map((v) => ({ v }))
  const gradId = 'spark-' + color.replace(/[^a-z0-9]/gi, '')
  return (
    <AreaChart
      width={w}
      height={h}
      data={chartData}
      margin={{ top: 3, right: 0, left: 0, bottom: 0 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={2}
        fill={`url(#${gradId})`}
        dot={(p: { cx?: number; cy?: number; index?: number }) =>
          p.index === data.length - 1 ? (
            <circle key="end" cx={p.cx ?? 0} cy={p.cy ?? 0} r={2.5} fill={color} />
          ) : (
            <g key={p.index} />
          )
        }
        activeDot={false}
      />
    </AreaChart>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly unknown[]
  label?: string | number
  prefix?: string
  suffix?: string
}

function ChartTooltip({ active, payload, label, prefix = '$', suffix = 'K' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const value = (payload[0] as { value?: number | string })?.value
  return (
    <div className="px-3.5 py-2 bg-card-hover border border-(--gold)">
      <div className="font-display font-extrabold text-[16px] text-(--gold)">
        {prefix}
        {value}
        {suffix}
      </div>
      <div className="text-[10px] tracking-[1px] uppercase text-muted">{label}</div>
    </div>
  )
}

const recentOrderColumns: Column<Order>[] = [
  { header: 'Pedido', className: cls.monoGold, render: (o) => o.id },
  { header: 'Cliente', render: (o) => <div className={cls.rowName}>{o.customer}</div> },
  { header: 'Fecha', className: `${cls.mono} text-[13px]`, render: (o) => fmtDate(o.date) },
  { header: 'Total', className: cls.valGold, render: (o) => `$${fmt(orderTotal(o))}` },
  {
    header: 'Estado',
    render: (o) => <StatusBadge config={ORDER_STATUS[o.status]} variant="filled" />,
  },
]

export default function DashboardPage() {
  const products = useAdminStore((s) => s.products)
  const orders = useAdminStore((s) => s.orders)
  const topProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5)
  const maxStock = Math.max(...topProducts.map((p) => p.stock))

  return (
    <div className="px-8 pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          {
            label: 'Ingresos (mes)',
            value: '$71.6K',
            delta: '↑ 15.3%',
            data: SPARK.revenue,
            color: '#58aaff',
          },
          { label: 'Pedidos', value: '247', delta: '↑ 8.1%', data: SPARK.orders, color: '#5f9eff' },
          {
            label: 'Clientes nuevos',
            value: '63',
            delta: '↑ 22.4%',
            data: SPARK.users,
            color: '#7b5fff',
          },
          {
            label: 'Ticket promedio',
            value: '$124',
            delta: '↑ 3.2%',
            data: SPARK.ticket,
            color: '#3fcf7f',
          },
        ].map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value}>
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-display font-extrabold text-[12px] text-[#3fcf7f]">
                {k.delta}
              </span>
            </div>
            <Sparkline data={k.data} color={k.color} w={160} h={40} />
          </KpiCard>
        ))}
      </div>

      {/* Área + Donut */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className={cls.panel}>
          <PanelHeader
            label="Ingresos"
            title="Ventas últimos 12 meses"
            mb="mb-5"
            side={
              <div className="font-display text-[22px] font-black text-right">
                $667.9K
                <span className="block text-[10px] font-medium tracking-[1px] uppercase text-muted">
                  total anual
                </span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={SALES_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58aaff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#58aaff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,150,255,.1)" />
              <XAxis
                dataKey="m"
                tick={{ fill: 'rgba(240,238,232,.42)', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(240,238,232,.42)', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}K`}
              />
              <Tooltip content={ChartTooltip} />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#58aaff"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#58aaff', stroke: 'var(--surf)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={cls.panel}>
          <PanelHeader label="Distribución" title="Ventas por categoría" mb="mb-5" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={CATEGORY_PIE}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                strokeWidth={0}
              >
                {CATEGORY_PIE.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}%`, 'Ventas']}
                contentStyle={{
                  background: 'var(--card-h)',
                  border: '1px solid var(--gold)',
                  borderRadius: 0,
                }}
                labelStyle={{ color: 'var(--mt)' }}
                itemStyle={{ color: 'var(--text)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2.5 mt-1">
            {CATEGORY_PIE.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2.5">
                <span className={cn('w-2.5 h-2.5 shrink-0', `pie-dot-${i}`)} />
                <span className="text-[13px] flex-1">{d.name}</span>
                <span className="font-display font-extrabold text-[16px]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barras + Top productos */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className={cls.panel}>
          <PanelHeader
            label="Rendimiento"
            title="Pedidos últimos 14 días"
            mb="mb-5"
            side={
              <div className="font-display text-[22px] font-black text-right">
                +18%
                <span className="block text-[10px] font-medium tracking-[1px] uppercase text-muted">
                  vs anterior
                </span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ORDERS_DAILY} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,150,255,.1)" vertical={false} />
              <XAxis
                dataKey="d"
                tick={{ fill: 'rgba(240,238,232,.42)', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={(props) => <ChartTooltip {...props} prefix="" suffix=" pedidos" />}
              />
              <Bar
                dataKey="v"
                fill="var(--card-h)"
                radius={[2, 2, 0, 0]}
                activeBar={{ fill: '#58aaff', stroke: '#58aaff', strokeWidth: 1 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cls.panel}>
          <PanelHeader
            label="Más vendidos"
            title="Top productos"
            side={
              <Link
                href="/admin/products"
                className="font-display text-[14px] font-bold no-underline tracking-[1px] text-muted"
              >
                Ver todos →
              </Link>
            }
          />
          <div className="flex flex-col gap-3.5">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3.5">
                <span className="font-display font-black text-[18px] w-4.5 text-muted">
                  {i + 1}
                </span>
                <div className={`${CAT_STRIPE[p.cat]} w-10 h-10 shrink-0`} />
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
                      style={{ width: `${(p.stock / maxStock) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="font-display font-black text-[18px] text-right">
                  {p.stock}
                  <span className="block text-[9px] font-medium tracking-[1px] uppercase text-muted">
                    uds
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className={cls.panel}>
        <PanelHeader
          label="Actividad reciente"
          title="Últimos pedidos"
          side={
            <Link
              href="/admin/orders"
              className="font-display text-[14px] font-bold no-underline tracking-[1px] text-muted"
            >
              Ver todos →
            </Link>
          }
        />
        <AdminTable
          columns={recentOrderColumns}
          data={orders.slice(0, 5)}
          keyExtractor={(o) => o.id}
          noWrapper
        />
      </div>
    </div>
  )
}
