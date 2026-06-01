import type { PromotionRow } from '@/modules/catalog/repositories/promotion.repo'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { BadgePercent, Package, Truck } from 'lucide-react'

interface Props {
  promotion: PromotionRow
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  isPending: boolean
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
  activo: { label: 'Activo', color: '#22c55e' },
  inactivo: { label: 'Inactivo', color: '#6b7280' },
} as const

export function PromotionCard({ promotion, onEdit, onToggle, onDelete, isPending }: Props) {
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
        <StatusBadge
          config={{ label: ACTIVE_STATUS[statusKey].label, color: ACTIVE_STATUS[statusKey].color }}
          variant="filled"
        />
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
            <span className="font-mono text-[11px]">
              {promotion.startsAt ? new Date(promotion.startsAt).toLocaleDateString('es-PE') : '—'}{' '}
              → {promotion.endsAt ? new Date(promotion.endsAt).toLocaleDateString('es-PE') : '∞'}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 px-5 pb-5">
        <Button variant="outline" size="sm" full onClick={onEdit}>
          Editar
        </Button>
        <Button variant="outline" size="sm" full onClick={onToggle} disabled={isPending}>
          {promotion.active ? 'Pausar' : 'Activar'}
        </Button>
        <Button variant="icon" size="sm" destructive onClick={onDelete} disabled={isPending}>
          ×
        </Button>
      </div>
    </div>
  )
}
