import type { ComplaintDueStatus } from '@/features/complaints/lib/business-days'

/** Semáforo del plazo legal en el admin: etiqueta + clases del badge. */
export const DUE_STATUS_META: Record<ComplaintDueStatus, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'badge-red' },
  'due-soon': { label: 'Por vencer', className: 'badge-amber' },
  'on-time': { label: 'En plazo', className: 'badge-green' },
  answered: { label: 'Respondido', className: 'text-muted border border-(--bd)' },
}
