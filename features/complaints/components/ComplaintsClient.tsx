'use client'

import {
  resendComplaintEmail,
  respondComplaint,
  type RespondComplaintData,
} from '@/features/complaints/actions/complaint.actions'
import { ComplaintDetailDrawer } from '@/features/complaints/components/ComplaintDetailDrawer'
import type { ComplaintDueStatus } from '@/features/complaints/lib/business-days'
import { COMPLAINT_TYPE_LABELS } from '@/features/complaints/lib/complaint-sheet'
import { DUE_STATUS_META } from '@/features/complaints/lib/due-status-meta'
import type { ComplaintRow } from '@/features/complaints/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { useServerAction } from '@/shared/hooks/admin/useServerAction'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn, formatDate } from '@/shared/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export type SerializedComplaint = Omit<ComplaintRow, 'claimedAmount'> & {
  claimedAmount: number | null
  /** Semáforo del plazo legal, calculado en el servidor */
  dueStatus: ComplaintDueStatus
}

interface ComplaintsClientProps {
  complaints: SerializedComplaint[]
}

function serialize(updated: ComplaintRow): SerializedComplaint {
  return {
    ...updated,
    claimedAmount: updated.claimedAmount != null ? Number(updated.claimedAmount) : null,
    dueStatus: 'answered',
  }
}

export function ComplaintsClient({ complaints }: ComplaintsClientProps) {
  const [detail, setDetail] = useState<SerializedComplaint | null>(null)
  const { isPending, run } = useServerAction()

  const applyResult = (data: RespondComplaintData, okMsg: string, failMsg: string) => {
    const next = serialize(data.complaint)
    setDetail(next.status === 'ANSWERED' ? next : { ...next, dueStatus: detail?.dueStatus ?? 'on-time' })
    // El texto refleja el envío real del correo, no solo el registro.
    if (data.emailSent) toast.success(okMsg)
    else toast.warning(failMsg)
  }

  const handleRespond = (complaintId: string, response: string, providerActions: string) => {
    run(() => respondComplaint({ complaintId, response, providerActions }), {
      onSuccess: (data) =>
        applyResult(
          data,
          'Respuesta registrada y enviada al consumidor por correo',
          'Respuesta registrada, pero el correo NO se pudo enviar. Reintenta el envío desde el detalle.',
        ),
      refresh: true,
    })
  }

  const handleResend = (complaintId: string, kind: 'constancia' | 'respuesta') => {
    run(() => resendComplaintEmail({ complaintId, kind }), {
      onSuccess: (data) =>
        applyResult(
          data,
          kind === 'constancia' ? 'Constancia reenviada al consumidor' : 'Respuesta reenviada al consumidor',
          'No se pudo enviar el correo. Revisa la configuración SMTP.',
        ),
      refresh: true,
    })
  }

  const columns = useMemo<Column<SerializedComplaint>[]>(
    () => [
      { header: 'Código', className: cls.monoGold, render: (c) => c.code },
      {
        header: 'Consumidor',
        render: (c) => (
          <>
            <div className={cn(cls.rowName, 'text-[14px]')}>{c.fullName}</div>
            <div className={cls.rowSub}>{c.email}</div>
          </>
        ),
      },
      { header: 'Tipo', render: (c) => COMPLAINT_TYPE_LABELS[c.type] ?? c.type },
      {
        header: 'Fecha',
        className: 'text-[13px] text-muted whitespace-nowrap',
        render: (c) => formatDate(c.createdAt, 'd MMM yyyy'),
      },
      {
        header: 'Vence',
        className: 'text-[13px] whitespace-nowrap',
        render: (c) => {
          const meta = DUE_STATUS_META[c.dueStatus]
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="text-muted">{formatDate(c.dueAt, 'd MMM yyyy')}</span>
              <span className={cn('text-[10px] tracking-[1px] uppercase px-2 py-0.5', meta.className)}>
                {meta.label}
              </span>
            </div>
          )
        },
      },
      {
        header: 'Estado',
        render: (c) => (
          <span
            className={cn(
              'text-[10px] tracking-[1px] uppercase px-2 py-1',
              c.status === 'ANSWERED' ? 'badge-green' : 'badge-amber',
            )}
          >
            {c.status === 'ANSWERED' ? 'Respondido' : 'Pendiente'}
          </span>
        ),
      },
      {
        header: '',
        className: 'text-right text-muted',
        render: () => <ChevronRight size={14} className="inline-block" aria-hidden="true" />,
      },
    ],
    [],
  )

  return (
    <>
      <AdminTable columns={columns} data={complaints} keyExtractor={(c) => c.id} onRowClick={setDetail} />

      {detail && (
        <ComplaintDetailDrawer
          key={detail.id}
          complaint={detail}
          onClose={() => setDetail(null)}
          onRespond={handleRespond}
          onResend={handleResend}
          isPending={isPending}
        />
      )}
    </>
  )
}
