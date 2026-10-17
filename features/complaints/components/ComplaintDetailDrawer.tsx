'use client'

import type { SerializedComplaint } from '@/features/complaints/components/ComplaintsClient'
import { COMPLAINT_TYPE_LABELS, GOOD_TYPE_LABELS } from '@/features/complaints/lib/complaint-sheet'
import { DUE_STATUS_META } from '@/features/complaints/lib/due-status-meta'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { DrawerSection } from '@/shared/components/admin/DrawerSection'
import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn, formatDate } from '@/shared/lib/utils'
import { Lock, Mail, Send } from 'lucide-react'
import { useState } from 'react'

const DATE_TIME = 'd MMM yyyy, HH:mm'

interface ComplaintDetailDrawerProps {
  complaint: SerializedComplaint
  onClose: () => void
  onRespond: (complaintId: string, response: string, providerActions: string) => void
  onResend: (complaintId: string, kind: 'constancia' | 'respuesta') => void
  isPending: boolean
}

function EmailStatus({
  label,
  sentAt,
  onResend,
  disabled,
}: {
  label: string
  sentAt: Date | null
  onResend: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className={sentAt ? 'text-muted' : 'text-[#ff6644]'}>
        <Mail size={12} className="inline-block mr-1.5 -mt-0.5" aria-hidden="true" />
        {label}: {sentAt ? `enviada el ${formatDate(sentAt, DATE_TIME)}` : 'NO enviada'}
      </span>
      {!sentAt && (
        <Button variant="outline" size="sm" onClick={onResend} disabled={disabled}>
          Reenviar
        </Button>
      )}
    </div>
  )
}

export function ComplaintDetailDrawer({
  complaint,
  onClose,
  onRespond,
  onResend,
  isPending,
}: ComplaintDetailDrawerProps) {
  const [response, setResponse] = useState('')
  const [providerActions, setProviderActions] = useState('')
  const isAnswered = complaint.status === 'ANSWERED'
  const due = DUE_STATUS_META[complaint.dueStatus]

  return (
    <AdminDrawer
      title={complaint.code}
      sub={`${COMPLAINT_TYPE_LABELS[complaint.type] ?? complaint.type} · ${formatDate(complaint.createdAt, DATE_TIME)}`}
      onClose={onClose}
    >
      <DrawerSection title="Plazo legal (15 días hábiles)" divider={false}>
        <div className="flex items-center gap-2 text-[13px]">
          <span>Vence el {formatDate(complaint.dueAt, 'd MMM yyyy')}</span>
          <span className={cn('text-[10px] tracking-[1px] uppercase px-2 py-0.5', due.className)}>
            {due.label}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          <EmailStatus
            label="Constancia al consumidor"
            sentAt={complaint.consumerEmailSentAt}
            onResend={() => onResend(complaint.id, 'constancia')}
            disabled={isPending}
          />
          {isAnswered && (
            <EmailStatus
              label="Respuesta al consumidor"
              sentAt={complaint.responseEmailSentAt}
              onResend={() => onResend(complaint.id, 'respuesta')}
              disabled={isPending}
            />
          )}
        </div>
      </DrawerSection>

      <DrawerSection title="Consumidor">
        <div className="font-display text-[20px] font-black uppercase">{complaint.fullName}</div>
        <div className="text-[13px] text-muted">
          {complaint.docType} {complaint.docNumber} · {complaint.email} · {complaint.phone}
        </div>
        <div className="text-[12px] text-muted mt-1">{complaint.address}</div>
        {complaint.isMinor && (
          <div className="text-[12px] mt-2">
            <span className="text-accent-ink font-semibold">Menor de edad.</span> Apoderado:{' '}
            {complaint.guardianName} ({complaint.guardianDocType} {complaint.guardianDocNumber})
          </div>
        )}
        <div className="text-[11px] text-muted mt-2">
          Declaración de veracidad: {complaint.truthDeclarationAccepted ? 'sí' : 'no registrada'} ·
          Consentimiento de datos: {complaint.privacyAccepted ? 'sí' : 'no registrado'}
        </div>
      </DrawerSection>

      <DrawerSection title="Bien contratado">
        <p className="text-[12px] text-muted mb-1">
          {GOOD_TYPE_LABELS[complaint.goodType] ?? complaint.goodType}
          {complaint.orderCode && <> · Pedido {complaint.orderCode}</>}
        </p>
        <p className="text-[13px] whitespace-pre-wrap">{complaint.productDescription}</p>
        {complaint.claimedAmount != null && (
          <p className="text-[13px] text-accent-ink font-semibold mt-1">
            Monto reclamado: S/ {complaint.claimedAmount.toFixed(2)}
          </p>
        )}
      </DrawerSection>

      <DrawerSection title="Detalle">
        <p className="text-[13px] whitespace-pre-wrap">{complaint.detail}</p>
      </DrawerSection>

      <DrawerSection title="Pedido del consumidor">
        <p className="text-[13px] whitespace-pre-wrap">{complaint.request}</p>
      </DrawerSection>

      <DrawerSection title="Respuesta del proveedor">
        {isAnswered ? (
          // La respuesta es inmutable: se muestra en modo lectura, sin edición.
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-muted flex items-center gap-1.5">
              <Lock size={11} aria-hidden="true" />
              Respondido el {complaint.respondedAt ? formatDate(complaint.respondedAt, DATE_TIME) : '—'}.
              La respuesta registrada no se puede modificar.
            </p>
            <p className="text-[13px] whitespace-pre-wrap">{complaint.response}</p>
            {complaint.providerActions && (
              <div>
                <div className={cn(cls.label, 'mb-1')}>Observaciones y acciones adoptadas</div>
                <p className="text-[13px] whitespace-pre-wrap">{complaint.providerActions}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="complaint-response" className={cn(cls.label, 'block mb-1')}>
                Respuesta al consumidor
              </label>
              <textarea
                id="complaint-response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={5}
                disabled={isPending}
                className={cls.input}
                placeholder="Escribe la respuesta que se enviará al consumidor..."
              />
            </div>
            <div>
              <label htmlFor="complaint-provider-actions" className={cn(cls.label, 'block mb-1')}>
                Observaciones y acciones adoptadas por el proveedor (opcional)
              </label>
              <textarea
                id="complaint-provider-actions"
                value={providerActions}
                onChange={(e) => setProviderActions(e.target.value)}
                rows={3}
                disabled={isPending}
                className={cls.input}
                placeholder="Ej. Se coordinó el cambio del producto el 20/10/2026..."
              />
            </div>
            <p className="text-[11px] text-muted">
              Una vez enviada, la respuesta queda registrada de forma permanente y no se puede editar.
            </p>
            <div>
              <Button
                variant="accent"
                size="sm"
                disabled={isPending || response.trim().length < 3}
                onClick={() => onRespond(complaint.id, response.trim(), providerActions.trim())}
              >
                <Send size={13} className="mr-1.5" aria-hidden="true" />
                Registrar y enviar respuesta
              </Button>
            </div>
          </div>
        )}
      </DrawerSection>
    </AdminDrawer>
  )
}
