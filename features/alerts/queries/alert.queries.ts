import 'server-only'
import { db } from '@/shared/lib/db'

export interface AdminAlertItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  /** ISO string — serializable hacia componentes cliente */
  createdAt: string
}

export async function getAdminAlerts(take = 15): Promise<{
  alerts: AdminAlertItem[]
  unreadCount: number
}> {
  const [rows, unreadCount] = await Promise.all([
    db.adminAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    }),
    db.adminAlert.count({ where: { readAt: null } }),
  ])

  return {
    alerts: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      read: r.readAt != null,
      createdAt: r.createdAt.toISOString(),
    })),
    unreadCount,
  }
}
