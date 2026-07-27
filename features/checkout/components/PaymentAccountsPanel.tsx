'use client'

import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { cn } from '@/shared/lib/utils'
import { Copy, Landmark, QrCode } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

type Props = {
  accounts: PaymentAccountData[]
  /** Fondo del panel — el checkout va sobre `card`, la pantalla de éxito sobre `surf` */
  className?: string
}

// ---------------------------------------------------------------------------
// Cuentas para pagar — se muestran igual en el checkout y en la pantalla de
// éxito, así que viven en un solo sitio. Las billeteras (Yape, Plin) pueden
// llevar un QR que el cliente escanea desde su app.
// ---------------------------------------------------------------------------

/** Valor copiable al portapapeles (número de cuenta, CCI) */
export function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      title={`Copiar ${label.toLowerCase()}`}
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => toast.success(`${label} copiado`))
          .catch(() => {})
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[13px] text-text hover:text-accent-ink transition-colors cursor-pointer"
    >
      {value}
      <Copy size={12} className="opacity-50" />
    </button>
  )
}

export function PaymentAccountsPanel({ accounts, className }: Props) {
  if (accounts.length === 0) return null

  return (
    <div className={cn('border border-(--bd)', className)}>
      <div className="px-4 py-3 border-b border-(--bd) flex items-center gap-2">
        <Landmark size={14} className="text-accent-ink" aria-hidden />
        <span className="text-[10px] tracking-[2px] uppercase text-muted">
          Cuentas para realizar tu pago
        </span>
      </div>
      <ul className="divide-y divide-(--bd)">
        {accounts.map((acc) => (
          <li key={acc.id} className="px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[13px] uppercase tracking-tight">
                {acc.name}
              </span>
              {acc.holder && <span className="text-[11px] text-muted">— {acc.holder}</span>}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span className="text-[11px] text-muted">
                {acc.cci ? 'Cuenta: ' : 'Número: '}
                <CopyValue label="Número" value={acc.number} />
              </span>
              {acc.cci && (
                <span className="text-[11px] text-muted">
                  CCI: <CopyValue label="CCI" value={acc.cci} />
                </span>
              )}
            </div>

            {acc.qrImageUrl && (
              <div className="flex items-start gap-3 mt-1">
                {/* Se abre en una pestaña para poder ampliarlo o guardarlo:
                    quien paga desde el mismo celular no puede escanear su propia
                    pantalla y necesita descargar la imagen. */}
                <a
                  href={acc.qrImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-(--bd) bg-white p-1.5 shrink-0"
                  title={`Ver el QR de ${acc.name} en grande`}
                >
                  <Image
                    src={acc.qrImageUrl}
                    alt={`Código QR de ${acc.name}`}
                    width={132}
                    height={132}
                    className="w-33 h-33 object-contain"
                  />
                </a>
                <p className="text-[11px] text-muted leading-snug">
                  <span className="inline-flex items-center gap-1 text-text font-semibold">
                    <QrCode size={12} aria-hidden />
                    Escanea el QR
                  </span>
                  <span className="block mt-1">
                    Ábrelo desde tu app de {acc.name} o tócalo para verlo en grande y guardarlo.
                  </span>
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
