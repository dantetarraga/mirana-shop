import { PromotionCardActions } from '@/features/promotions/components/PromotionCardActions'
import type { PromotionRow } from '@/features/promotions/types'
import { StatusBadge } from '@/features/orders/components/StatusBadge'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { BadgePercent, MoveRight, Package, Truck } from 'lucide-react'

interface Props {
  promotion: PromotionRow
}

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  FREE_SHIPPING: {
    icon: <Truck size={18} />,
    label: 'Envío gratis',
    color: 'text-emerald-400',
  },
  FIXED_DISCOUNT: {
    icon: <Package size={18} />,
    label: 'Descuento fijo',
    color: 'text-sky-400',
  },
  PERCENT_DISCOUNT: {
    icon: <BadgePercent size={18} />,
    label: 'Descuento %',
    color: 'text-violet-400',
  },
}

const ACTIVE_STATUS = {
  activo: { label: 'Activo', cls: 'badge-green', outlineCls: 'badge-green-outline' },
  inactivo: { label: 'Inactivo', cls: 'badge-red', outlineCls: 'badge-red-outline' },
} as const

export function PromotionCard({ promotion }: Props) {
  const meta = TYPE_META[promotion.type] ?? TYPE_META.FREE_SHIPPING
  const statusKey = promotion.active ? 'activo' : 'inactivo'

  return (
    <div className="bg-card border border-(--bd) overflow-hidden flex flex-col">
      {/* Header con tipo */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-(--bd)">
        <span className={meta.color}>{meta.icon}</span>
        <div className="flex-1">
          <div className="font-display font-extrabold text-[15px] uppercase tracking-tight leading-tight">
            {promotion.name}
          </div>
          <div className="text-[11px] text-muted tracking-[1px] uppercase mt-0.5">{meta.label}</div>
        </div>
        <StatusBadge config={ACTIVE_STATUS[statusKey]} variant="filled" />
      </div>

      {/* Detalles */}
      <div className="px-5 py-4 flex flex-col gap-2 flex-1">
        {promotion.description && (
          <p className="text-[13px] text-muted leading-snug mb-2">{promotion.description}</p>
        )}

        {promotion.minAmount != null && (
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Monto mínimo</span>
            <span className="font-semibold">{formatCurrency(promotion.minAmount)}</span>
          </div>
        )}

        {promotion.discountAmount != null && (
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Descuento</span>
            <span className="font-semibold text-sky-400">
              {formatCurrency(promotion.discountAmount)}
            </span>
          </div>
        )}

        {promotion.discountPercent != null && (
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Porcentaje</span>
            <span className="font-semibold text-violet-400">{promotion.discountPercent}%</span>
          </div>
        )}

        {(promotion.startsAt || promotion.endsAt) && (
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Vigencia</span>
            <span className="font-mono text-[11px] inline-flex items-center gap-1.5">
              {promotion.startsAt ? formatDate(promotion.startsAt, 'P') : '—'}
              <MoveRight size={11} className="text-muted" />
              {promotion.endsAt ? formatDate(promotion.endsAt, 'P') : '∞'}
            </span>
          </div>
        )}
      </div>

      <PromotionCardActions promotion={promotion} />
    </div>
  )
}
