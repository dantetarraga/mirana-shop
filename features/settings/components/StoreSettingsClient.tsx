'use client'

import {
  savePaymentAccounts,
  type PaymentAccountInput,
} from '@/features/settings/actions/payment-accounts.actions'
import { saveStoreSettings } from '@/features/settings/actions/store-settings.actions'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import type { StoreSettingsData } from '@/features/settings/queries/store-settings.queries'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useServerAction } from '@/shared/hooks/admin'
import { cn } from '@/shared/lib/utils'
import { Landmark, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface StoreSettingsClientProps {
  initial: StoreSettingsData
  initialAccounts: PaymentAccountData[]
}

// ---------------------------------------------------------------------------
// Configuración general (stock + WhatsApp) y métodos de pago (Yape, bancos).
// Cada card guarda por separado.
// ---------------------------------------------------------------------------

export function StoreSettingsClient({ initial, initialAccounts }: StoreSettingsClientProps) {
  const [form, setForm] = useState<StoreSettingsData>(initial)
  const [accounts, setAccounts] = useState<PaymentAccountInput[]>(initialAccounts)
  const general = useServerAction()
  const payments = useServerAction()

  const saveGeneral = () =>
    general.run(() => saveStoreSettings(form), {
      successMsg: 'Configuración guardada',
      refresh: true,
    })

  const savePayments = () =>
    payments.run(() => savePaymentAccounts(accounts), {
      successMsg: 'Métodos de pago guardados',
      refresh: true,
    })

  const setAccount = (index: number, patch: Partial<PaymentAccountInput>) =>
    setAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))

  const addAccount = () =>
    setAccounts((prev) => [
      ...prev,
      { id: '', name: '', holder: '', number: '', cci: '', active: true },
    ])

  const removeAccount = (index: number) =>
    setAccounts((prev) => prev.filter((_, i) => i !== index))

  const paymentsValid = accounts.every((a) => a.name.trim() && a.number.trim())

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark size={15} className="text-(--gold)" />
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">
                Métodos de pago del checkout
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={addAccount}>
              <Plus size={13} className="mr-1.5" /> Agregar método
            </Button>
          </div>

          <p className="text-[12px] text-muted">
            Estas cuentas se muestran al cliente en el checkout para que realice su pago. Para
            billeteras como Yape o Plin deja el CCI vacío; para cuentas bancarias (BCP, BBVA,
            Interbank…) completa número de cuenta y CCI.
          </p>

          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted text-[13px] border border-dashed border-(--bd)">
              Sin métodos de pago. Agrega el primero — ej: Yape, BCP Soles, BBVA.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {accounts.map((acc, i) => (
                <div
                  key={acc.id || `new-${i}`}
                  className={cn(
                    'border border-(--bd) p-4 flex flex-col gap-3',
                    !acc.active && 'opacity-55',
                  )}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Nombre">
                      <input
                        value={acc.name}
                        onChange={(e) => setAccount(i, { name: e.target.value })}
                        className="adm-input"
                        placeholder="Yape / BCP Soles / BBVA"
                      />
                    </FormField>
                    <FormField label="Titular (opcional)">
                      <input
                        value={acc.holder}
                        onChange={(e) => setAccount(i, { holder: e.target.value })}
                        className="adm-input"
                        placeholder="Nombre del titular"
                      />
                    </FormField>
                    <FormField label="Número (cuenta o celular)">
                      <input
                        value={acc.number}
                        onChange={(e) => setAccount(i, { number: e.target.value })}
                        className="adm-input"
                        placeholder="987654321 o 191-1234567-0-00"
                      />
                    </FormField>
                    <FormField label="CCI (solo cuentas bancarias)">
                      <input
                        value={acc.cci}
                        onChange={(e) => setAccount(i, { cci: e.target.value })}
                        className="adm-input"
                        placeholder="002-191-001234567000-00"
                      />
                    </FormField>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-[12px] text-muted select-none">
                      <input
                        type="checkbox"
                        checked={acc.active}
                        onChange={(e) => setAccount(i, { active: e.target.checked })}
                        className="accent-(--gold)"
                      />
                      Visible en el checkout
                    </label>
                    <Button
                      variant="icon"
                      size="sm"
                      destructive
                      title="Eliminar método"
                      onClick={() => removeAccount(i)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <Button
              variant="accent"
              size="md"
              onClick={savePayments}
              disabled={payments.isPending || !paymentsValid}
            >
              <Save size={15} className="mr-1.5" />
              {payments.isPending ? 'Guardando…' : 'Guardar métodos de pago'}
            </Button>
            {!paymentsValid && (
              <p className="text-[12px] text-red-400 mt-2">
                Todos los métodos necesitan al menos nombre y número.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
