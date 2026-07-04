'use client'

import { deletePaymentAccount } from '@/features/settings/actions/payment-accounts.actions'
import { saveStoreSettings } from '@/features/settings/actions/store-settings.actions'
import { PaymentAccountDrawer } from '@/features/settings/components/PaymentAccountDrawer'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import type { StoreSettingsData } from '@/features/settings/queries/store-settings.queries'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { FormField } from '@/shared/components/ui/FormField'
import { useEntityCrud, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { Check, Landmark, Pencil, Plus, Save, Smartphone, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface StoreSettingsClientProps {
  initial: StoreSettingsData
  initialAccounts: PaymentAccountData[]
}

// ---------------------------------------------------------------------------
// Configuración de la tienda:
// - General: stock + WhatsApp (guardado directo).
// - Métodos de pago: lista compacta → drawer lateral para crear/editar y
//   ConfirmModal para eliminar (mismo patrón que marcas/categorías).
// ---------------------------------------------------------------------------

export function StoreSettingsClient({ initial, initialAccounts }: StoreSettingsClientProps) {
  const [form, setForm] = useState<StoreSettingsData>(initial)
  const general = useServerAction()
  const crud = useEntityCrud<PaymentAccountData>(
    deletePaymentAccount,
    (a) => `"${a.name}" eliminado`,
  )

  const saveGeneral = () =>
    general.run(() => saveStoreSettings(form), {
      successMsg: 'Configuración guardada',
      refresh: true,
    })

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader label="Configuración" title="Tienda" align="center" />

      <div className="max-w-175 flex flex-col gap-6">
        {/* ── General ─────────────────────────────────────── */}
        <div className="bg-card border border-(--bd) p-5 flex flex-col gap-5">
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-muted">General</div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.showOutOfStock}
              onChange={(e) => setForm({ ...form, showOutOfStock: e.target.checked })}
              className="mt-1 accent-(--gold)"
            />
            <span>
              <span className="block text-[14px] font-semibold">
                Mostrar productos sin stock en la tienda
              </span>
              <span className="block text-[12px] text-muted mt-1">
                Si lo desactivas, los productos con stock 0 desaparecen del catálogo, el buscador,
                las novedades y los relacionados. Siempre seguirán visibles en el admin y las
                preventas no se ven afectadas.
              </span>
            </span>
          </label>

          <FormField label="WhatsApp de la tienda (código de país + número, solo dígitos)">
            <input
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm({ ...form, whatsappNumber: e.target.value.replace(/\D/g, '') })
              }
              className="adm-input"
              placeholder="51987654321"
              inputMode="numeric"
            />
          </FormField>
          <p className="text-[12px] text-muted -mt-3">
            Se usa en el botón flotante de WhatsApp y en el envío de comprobantes del checkout.
          </p>

          <div>
            <Button variant="accent" size="md" onClick={saveGeneral} disabled={general.isPending}>
              <Save size={15} className="mr-1.5" />
              {general.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {/* ── Métodos de pago ─────────────────────────────── */}
        <div className="bg-card border border-(--bd) p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Landmark size={15} className="text-(--gold)" />
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">
                Métodos de pago del checkout
              </span>
            </div>
            <Button variant="accent" size="sm" onClick={crud.openNew}>
              <Plus size={13} className="mr-1.5" /> Agregar método
            </Button>
          </div>

          {initialAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted text-[13px] border border-dashed border-(--bd)">
              Sin métodos de pago. Agrega el primero — ej: Yape, BCP Soles, BBVA.
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-(--bd) border border-(--bd)">
              {initialAccounts.map((acc) => {
                const Icon = acc.cci ? Landmark : Smartphone
                return (
                  <li
                    key={acc.id}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3',
                      !acc.active && 'opacity-50',
                    )}
                  >
                    <div className="w-9 h-9 shrink-0 bg-surf border border-(--bd) flex items-center justify-center">
                      <Icon size={16} className="text-(--gold)" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cls.rowName}>{acc.name}</span>
                        {!acc.active && (
                          <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                            Oculto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-muted mt-0.5 min-w-0">
                        <span className="font-mono truncate">{acc.number}</span>
                        {acc.cci && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] tracking-[1px] uppercase text-(--gold)/80">
                            CCI <Check size={10} />
                          </span>
                        )}
                        {acc.holder && <span className="truncate">· {acc.holder}</span>}
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        variant="icon"
                        size="sm"
                        title="Editar"
                        onClick={() => crud.openEdit(acc)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        destructive
                        title="Eliminar"
                        disabled={crud.isPending}
                        onClick={() => crud.openDelete(acc)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="text-[12px] text-muted">
            Estas cuentas se muestran al cliente en el checkout para que realice su pago.
          </p>
        </div>
      </div>

      {/* Confirmación de eliminación */}
      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar método de pago?"
        description={`"${crud.pendingDelete?.name}" (${crud.pendingDelete?.number ?? ''}) dejará de mostrarse en el checkout y se eliminará permanentemente.`}
        isPending={crud.isPending}
      />

      {/* Drawer lateral crear/editar */}
      {crud.drawerOpen && (
        <PaymentAccountDrawer
          account={crud.editing}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
        />
      )}
    </div>
  )
}
