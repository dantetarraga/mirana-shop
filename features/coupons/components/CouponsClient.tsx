'use client'

import { deleteCoupon, toggleCoupon } from '@/features/coupons/actions/coupon.actions'
import { CouponDrawer } from '@/features/coupons/components/CouponDrawer'
import type { CouponRow, PromotionOption } from '@/features/coupons/types'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn, formatDate } from '@/shared/lib/utils'
import { Copy, Eye, EyeOff, Pencil, Plus, Ticket, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const PROMO_TYPE_LABELS: Record<string, string> = {
  FREE_SHIPPING: 'Envío gratis',
  FIXED_DISCOUNT: 'Descuento fijo',
  PERCENT_DISCOUNT: 'Descuento %',
}

interface Props {
  coupons: CouponRow[]
  promotions: PromotionOption[]
}

export function CouponsClient({ coupons, promotions }: Props) {
  const crud = useEntityCrud<CouponRow>(deleteCoupon, (c) => `Cupón ${c.code} eliminado`)

  const toggle = (c: CouponRow) =>
    crud.run(() => toggleCoupon(c.id, c.active), {
      successMsg: c.active ? `${c.code} desactivado` : `${c.code} activado`,
      refresh: true,
    })

  const copyCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(`${code} copiado`))
      .catch(() => {})
  }

  const activeCount = coupons.filter((c) => c.active).length

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Marketing"
        title={`${activeCount} cupón${activeCount !== 1 ? 'es' : ''} activo${activeCount !== 1 ? 's' : ''}`}
        align="center"
        side={
          <Button variant="accent" size="sm" onClick={crud.openNew} disabled={promotions.length === 0}>
            <Plus size={13} className="mr-1.5" /> Nuevo cupón
          </Button>
        }
      />

      {promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-3 border border-dashed border-(--bd)">
          <Ticket size={48} strokeWidth={1} aria-hidden />
          <p className="text-[14px]">Primero crea una promoción.</p>
          <p className="text-[12px] max-w-110 text-center">
            Un cupón no define el beneficio: solo desbloquea una promoción. Crea la promoción, marca
            «Solo con cupón» y vuelve aquí.
          </p>
          <Link href="/admin/promotions" className="ui-btn ui-btn--accent ui-btn--sm no-underline">
            Ir a Promociones
          </Link>
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-3 border border-dashed border-(--bd)">
          <Ticket size={48} strokeWidth={1} aria-hidden />
          <p className="text-[14px]">No hay cupones creados todavía.</p>
          <Button variant="accent" size="sm" onClick={crud.openNew}>
            <Plus size={13} className="mr-1.5" /> Crear el primero
          </Button>
        </div>
      ) : (
        <div className={cls.panelTable}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-160">
              <thead>
                <tr>
                  <th className={cls.th}>Código</th>
                  <th className={cls.th}>Promoción</th>
                  <th className={cls.th}>Canjes</th>
                  <th className={cls.th}>Vigencia</th>
                  <th className={cls.th}>Estado</th>
                  <th className={cls.th} />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const exhausted = c.maxUses != null && c.usedCount >= c.maxUses
                  const usable = c.active && c.promotionActive && !exhausted
                  return (
                    <tr key={c.id} className={cn(!c.active && 'opacity-55')}>
                      <td className={cls.td}>
                        <button
                          type="button"
                          onClick={() => copyCode(c.code)}
                          title="Copiar código"
                          className="inline-flex items-center gap-1.5 font-mono font-bold text-[14px] tracking-[1px] hover:text-accent-ink transition-colors cursor-pointer"
                        >
                          {c.code}
                          <Copy size={12} className="opacity-50" />
                        </button>
                      </td>
                      <td className={cls.td}>
                        <div className="text-[13px]">{c.promotionName}</div>
                        <div className={cls.rowSub}>
                          {PROMO_TYPE_LABELS[c.promotionType] ?? c.promotionType}
                        </div>
                      </td>
                      <td className={cls.td}>
                        <span className="font-mono text-[13px]">
                          {c.usedCount}
                          {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                        </span>
                        {c.maxUses == null && (
                          <span className="text-[11px] text-muted"> · ilimitado</span>
                        )}
                      </td>
                      <td className={cls.td}>
                        <span className="font-mono text-[11px] text-muted">
                          {c.startsAt ? formatDate(c.startsAt, 'P') : '—'} →{' '}
                          {c.endsAt ? formatDate(c.endsAt, 'P') : '∞'}
                        </span>
                      </td>
                      <td className={cls.td}>
                        {usable ? (
                          <span className="badge-green text-[10px] tracking-[1px] uppercase px-2 py-1">
                            Canjeable
                          </span>
                        ) : (
                          <span
                            className="badge-red text-[10px] tracking-[1px] uppercase px-2 py-1"
                            title={
                              !c.active
                                ? 'Cupón desactivado'
                                : exhausted
                                  ? 'Alcanzó su límite de canjes'
                                  : 'Su promoción no está vigente'
                            }
                          >
                            {!c.active ? 'Inactivo' : exhausted ? 'Agotado' : 'Sin promo'}
                          </span>
                        )}
                      </td>
                      <td className={`${cls.td} text-right whitespace-nowrap`}>
                        <div className="inline-flex gap-1.5">
                          <Button
                            variant="icon"
                            size="sm"
                            title={c.active ? 'Desactivar' : 'Activar'}
                            disabled={crud.isPending}
                            onClick={() => toggle(c)}
                          >
                            {c.active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button
                            variant="icon"
                            size="sm"
                            title="Editar"
                            onClick={() => crud.openEdit(c)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="icon"
                            size="sm"
                            destructive
                            title="Eliminar"
                            disabled={crud.isPending}
                            onClick={() => crud.openDelete(c)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar cupón?"
        description={`El código "${crud.pendingDelete?.code ?? ''}" dejará de funcionar en el checkout. Los pedidos que ya lo usaron conservan el registro.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <CouponDrawer
          coupon={crud.editing}
          isNew={crud.isNew}
          promotions={promotions}
          onClose={crud.closeDrawer}
        />
      )}
    </div>
  )
}
