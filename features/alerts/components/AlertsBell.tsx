'use client'

import { generateAlertsNow, markAllAlertsRead } from '@/features/alerts/actions/alert.actions'
import type { AdminAlertItem } from '@/features/alerts/queries/alert.queries'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { Dates } from '@/shared/lib/dates'
import { Bell, CheckCheck, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

interface AlertsBellProps {
  alerts: AdminAlertItem[]
  unreadCount: number
}

const TYPE_LABELS: Record<string, string> = {
  LOW_STOCK: 'Inventario',
  PENDING_ORDERS: 'Pedidos',
  PROMO_EXPIRING: 'Promociones',
  DAILY_SUMMARY: 'Resumen',
}

export function AlertsBell({ alerts, unreadCount }: AlertsBellProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markRead = () =>
    startTransition(async () => {
      await markAllAlertsRead()
      router.refresh()
    })

  const generateNow = () =>
    startTransition(async () => {
      await generateAlertsNow()
      router.refresh()
    })

  return (
    <div className="relative" ref={ref}>
      <Button variant="icon" size="md" className="relative" onClick={() => setOpen((v) => !v)}>
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-(--gold) text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 w-95 max-w-[90vw] bg-surf border border-(--bd) shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-(--bd) flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-muted">
              Alertas
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={generateNow}
                disabled={isPending}
                title="Ejecuta el analizador de alertas ahora mismo"
                className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-(--gold) transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isPending ? 'animate-spin' : undefined} />
                Generar ahora
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markRead}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-(--gold) transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck size={13} /> Marcar leído
                </button>
              )}
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-muted">
              Sin alertas por ahora.
            </div>
          ) : (
            <ul className="max-h-100 overflow-y-auto divide-y divide-(--bd)">
              {alerts.map((a) => (
                <li key={a.id} className={cn('px-4 py-3', !a.read && 'bg-(--gold)/5')}>
                  <div className="flex items-center gap-2 mb-1">
                    {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-(--gold) shrink-0" />}
                    <span className="text-[9px] tracking-[1.5px] uppercase text-muted border border-(--bd) px-1.5 py-0.5">
                      {TYPE_LABELS[a.type] ?? a.type}
                    </span>
                    <span className="text-[10px] text-muted ml-auto shrink-0">
                      {Dates.formatWithTime(a.createdAt)}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold leading-snug">{a.title}</div>
                  <p className="text-[12px] text-muted leading-snug mt-0.5">{a.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
