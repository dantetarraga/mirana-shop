'use client'

import type { SerializedComplaint } from '@/features/complaints/components/ComplaintsClient'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { DrawerSection } from '@/shared/components/admin/DrawerSection'
import { Button } from '@/shared/components/ui/Button'
import { formatDate } from '@/shared/lib/utils'
import { Send } from 'lucide-react'
import { useState } from 'react'

const TYPE_LABELS: Record<string, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
}

interface ComplaintDetailDrawerProps {
  complaint: SerializedComplaint
  onClose: () => void
  onRespond: (complaintId: string, response: string) => void
  isPending: boolean
}

export function ComplaintDetailDrawer({
  complaint,
  onClose,
  onRespond,
  isPending,
}: ComplaintDetailDrawerProps) {
  const [response, setResponse] = useState(complaint.response ?? '')
  const isAnswered = complaint.status === 'ANSWERED'

  return (
    <AdminDrawer title={complaint.code} sub={TYPE_LABELS[complaint.type]} onClose={onClose}>
      <DrawerSection title="Consumidor" divider={false}>
        <div className="font-display text-[20px] font-black uppercase">{complaint.fullName}</div>
        <div className="text-[13px] text-muted">
          {complaint.docType} {complaint.docNumber} · {complaint.email} · {complaint.phone}
        </div>
        <div className="text-[12px] text-muted mt-1">{complaint.address}</div>
      </DrawerSection>

      <DrawerSection title="Bien contratado">
        <p className="text-[13px]">{complaint.productDescription}</p>
        {complaint.claimedAmount != null && (
          <p className="text-[13px] text-(--gold) font-semibold mt-1">
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
        {isAnswered && complaint.respondedAt && (
          <p className="text-[11px] text-muted mb-2">
            Respondido el {formatDate(complaint.respondedAt, 'd MMM yyyy')}
          </p>
        )}
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          disabled={isPending}
          className="adm-input"
          placeholder="Escribe la respuesta que se enviará al consumidor..."
        />
        <Button
          variant="accent"
          size="sm"
          className="mt-2.5"
          disabled={isPending || response.trim().length < 3}
          onClick={() => onRespond(complaint.id, response.trim())}
        >
          <Send size={13} className="mr-1.5" />
          {isAnswered ? 'Actualizar respuesta' : 'Enviar respuesta'}
        </Button>
      </DrawerSection>
    </AdminDrawer>
  )
}
