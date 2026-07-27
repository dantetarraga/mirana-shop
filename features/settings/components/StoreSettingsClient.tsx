'use client'

import {
  HOME_BLOCK_LABELS,
  HOME_BLOCKS,
  parseHiddenBlocks,
  serializeHiddenBlocks,
  type HomeBlockKey,
} from '@/features/home/lib/home-blocks'
import { deletePaymentAccount } from '@/features/settings/actions/payment-accounts.actions'
import { saveStoreSettings } from '@/features/settings/actions/store-settings.actions'
import { PaymentAccountDrawer } from '@/features/settings/components/PaymentAccountDrawer'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import type { StoreSettingsData } from '@/features/settings/queries/store-settings.queries'
import { ImageUploadField } from '@/shared/components/admin/ImageUploadField'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { FormField } from '@/shared/components/ui/FormField'
import { useEntityCrud, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import {
  Check,
  Eye,
  EyeOff,
  Landmark,
  LayoutList,
  Link2,
  Pencil,
  Plus,
  QrCode,
  Save,
  Smartphone,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
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
              className={cls.input}
              placeholder="51987654321"
              inputMode="numeric"
            />
          </FormField>
          <p className="text-[12px] text-muted -mt-3">
            Se usa en el botón flotante de WhatsApp y en el envío de comprobantes del checkout.
          </p>

          <FormField label="Cómo se muestran los banners del inicio">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    value: 'CARD',
                    title: 'Tarjetas',
                    desc: 'Grid de tarjetas; a partir de 4 se convierte en carrusel.',
                  },
                  {
                    value: 'FULLSCREEN',
                    title: 'Pantalla completa',
                    desc: 'Hero a ancho completo. Con varios banners se cruzan con un fundido.',
                  },
                ] as const
              ).map((opt) => {
                const isActive = form.bannerLayout === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setForm({ ...form, bannerLayout: opt.value })}
                    className={cn(
                      'text-left p-3.5 border transition-colors duration-200',
                      isActive
                        ? 'border-(--gold) bg-(--sub)'
                        : 'border-(--bd) hover:border-(--bdh)',
                    )}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-semibold">
                      {isActive && <Check size={14} className="text-accent-ink shrink-0" />}
                      {opt.title}
                    </span>
                    <span className="block text-[12px] text-muted mt-1">{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </FormField>
          <p className="text-[12px] text-muted -mt-3">
            Aplica a todos los banners activos por igual. Se gestionan en Banners.
          </p>

          <FormField label="Costo de envío base (S/)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.baseShippingCost}
              onChange={(e) => setForm({ ...form, baseShippingCost: Number(e.target.value) })}
              className={cls.input}
              placeholder="15.00"
              inputMode="decimal"
            />
          </FormField>
          <p className="text-[12px] text-muted -mt-3">
            Se cobra en el checkout salvo que una promoción de envío gratis lo anule.
          </p>

          <FormField label="Adelanto de preventa parcial (%)">
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={form.preorderDepositPercent}
              onChange={(e) => setForm({ ...form, preorderDepositPercent: Number(e.target.value) })}
              className={cls.input}
              placeholder="50"
              inputMode="numeric"
            />
          </FormField>
          <p className="text-[12px] text-muted -mt-3">
            Cuánto paga el cliente por adelantado al reservar. Cada producto puede definir su propio
            porcentaje; este es el que se usa cuando no lo hace.
          </p>

          <div>
            <Button variant="accent" size="md" onClick={saveGeneral} disabled={general.isPending}>
              <Save size={15} className="mr-1.5" />
              {general.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {/* ── Bloques del inicio ───────────────────────────── */}
        <HomeSectionBlocksPanel
          hiddenHomeBlocks={form.hiddenHomeBlocks}
          onChange={(val) => setForm({ ...form, hiddenHomeBlocks: val })}
          onSave={saveGeneral}
          isPending={general.isPending}
        />

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="bg-card border border-(--bd) p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-accent-ink" />
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">
              Footer
            </span>
          </div>

          <FormField label="Logo del footer">
            <ImageUploadField
              value={form.footerLogoUrl}
              onChange={(url) => setForm({ ...form, footerLogoUrl: url })}
              folder="settings"
              placeholder="https://..."
            />
          </FormField>
          <p className="text-[12px] text-muted -mt-3">
            Se muestra en el footer de la tienda. Si se deja vacío, aparece el texto MIRANA.
          </p>

          <div className="border-t border-(--bd) pt-4 flex flex-col gap-4">
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">
              Redes sociales
            </span>

            <FormField label="Instagram">
              <input
                value={form.instagramUrl}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                className={cls.input}
                placeholder="https://www.instagram.com/mirana.shop"
              />
            </FormField>

            <FormField label="TikTok">
              <input
                value={form.tiktokUrl}
                onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                className={cls.input}
                placeholder="https://www.tiktok.com/@mirana.shop"
              />
            </FormField>

            <FormField label="YouTube">
              <input
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                className={cls.input}
                placeholder="https://www.youtube.com/@miranashop"
              />
            </FormField>

            <FormField label="Facebook">
              <input
                value={form.facebookUrl}
                onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                className={cls.input}
                placeholder="https://www.facebook.com/mirana.shop"
              />
            </FormField>
          </div>

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
              <Landmark size={15} className="text-accent-ink" />
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
                    className={cn('flex items-center gap-4 px-4 py-3', !acc.active && 'opacity-50')}
                  >
                    <div className="w-9 h-9 shrink-0 bg-surf border border-(--bd) flex items-center justify-center overflow-hidden">
                      {acc.logoUrl ? (
                        <Image
                          src={acc.logoUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Icon size={16} className="text-accent-ink" />
                      )}
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
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] tracking-[1px] uppercase text-accent-ink/80">
                            CCI <Check size={10} />
                          </span>
                        )}
                        {acc.qrImageUrl && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] tracking-[1px] uppercase text-accent-ink/80">
                            <QrCode size={11} /> QR
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

// ---------------------------------------------------------------------------
// Sub-componente: panel para mostrar/ocultar los bloques fijos del inicio
// ---------------------------------------------------------------------------

interface HomeSectionBlocksPanelProps {
  hiddenHomeBlocks: string
  onChange: (csv: string) => void
  onSave: () => void
  isPending: boolean
}

const BLOCK_KEYS = Object.values(HOME_BLOCKS) as HomeBlockKey[]

function HomeSectionBlocksPanel({
  hiddenHomeBlocks,
  onChange,
  onSave,
  isPending,
}: HomeSectionBlocksPanelProps) {
  const hidden = parseHiddenBlocks(hiddenHomeBlocks)

  const toggle = (key: HomeBlockKey) => {
    const next = new Set(hidden)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(serializeHiddenBlocks(next))
  }

  return (
    <div className="bg-card border border-(--bd) p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <LayoutList size={15} className="text-accent-ink" />
        <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">
          Bloques del inicio
        </span>
      </div>
      <p className="text-[12px] text-muted -mt-3">
        Los bloques ocultos no se muestran en el inicio de la tienda. Las secciones personalizadas
        se administran en{' '}
        <a href="/admin/sections" className="underline hover:text-accent-ink transition-colors">
          Secciones
        </a>
        .
      </p>

      <ul className="flex flex-col divide-y divide-(--bd) border border-(--bd)">
        {BLOCK_KEYS.map((key) => {
          const isVisible = !hidden.has(key)
          const { title, desc } = HOME_BLOCK_LABELS[key]
          return (
            <li
              key={key}
              className={cn('flex items-start gap-4 px-4 py-3.5', !isVisible && 'opacity-55')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold">{title}</span>
                  {!isVisible && (
                    <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                      Oculto
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted mt-0.5">{desc}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggle(key)}
                className="shrink-0 self-center"
              >
                {isVisible ? (
                  <>
                    <EyeOff size={13} className="mr-1.5" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye size={13} className="mr-1.5" /> Mostrar
                  </>
                )}
              </Button>
            </li>
          )
        })}
      </ul>

      <div>
        <Button variant="accent" size="md" onClick={onSave} disabled={isPending}>
          <Save size={15} className="mr-1.5" />
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
