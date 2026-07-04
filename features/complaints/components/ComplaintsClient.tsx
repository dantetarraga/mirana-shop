'use client'

import { respondComplaint } from '@/features/complaints/actions/complaint.actions'
import { ComplaintDetailDrawer } from '@/features/complaints/components/ComplaintDetailDrawer'
import type { ComplaintRow } from '@/features/complaints/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn, formatDate } from '@/shared/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

export type SerializedComplaint = Omit<ComplaintRow, 'claimedAmount'> & {
  claimedAmount: number | null
}

const TYPE_LABELS: Record<string, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
}

interface ComplaintsClientProps {
  complaints: SerializedComplaint[]
}

export function ComplaintsClient({ complaints }: ComplaintsClientProps) {
  const [detail, setDetail] = useState<SerializedComplaint | null>(null)
  const { isPending, run } = useServerAction()

  const handleRespond = (complaintId: string, response: string) => {
    run(() => respondComplaint({ complaintId, response }), {
      successMsg: 'Respuesta enviada',
      onSuccess: (updated) =>
        setDetail({
          ...updated,
          claimedAmount: updated.claimedAmount != null ? Number(updated.claimedAmount) : null,
        }),
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
      { header: 'Tipo', render: (c) => TYPE_LABELS[c.type] ?? c.type },
      {
        header: 'Fecha',
        className: 'text-[13px] text-muted',
        render: (c) => formatDate(c.createdAt, 'd MMM'),
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
        render: () => <ChevronRight size={14} className="inline-block" />,
      },
    ],
    [],
  )

  return (
    <>
      <AdminTable columns={columns} data={complaints} keyExtractor={(c) => c.id} onRowClick={setDetail} />

      {detail && (
        <ComplaintDetailDrawer
          complaint={detail}
          onClose={() => setDetail(null)}
          onRespond={handleRespond}
          isPending={isPending}
        />
      )}
    </>
  )
}
