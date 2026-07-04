'use client'

import { AlertsBell } from '@/features/alerts/components/AlertsBell'
import type { AdminAlertItem } from '@/features/alerts/queries/alert.queries'
import { useAdminSidebarStore } from '@/shared/stores/admin-sidebar.store'
import { Calendar, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

const TITLES: Record<string, [string, string]> = {
  '/admin/dashboard': ['Resumen general', 'Vista de rendimiento de la tienda'],
  '/admin/orders': ['Pedidos', 'Gestión de órdenes y envíos'],
  '/admin/products': ['Productos', 'Catálogo y fichas de producto'],
  '/admin/inventory': ['Inventario', 'Control de stock y reabastecimiento'],
  '/admin/banners': ['Banners', 'Campañas y promociones visuales'],
  '/admin/users': ['Usuarios', 'Base de clientes y segmentación'],
  '/admin/complaints': ['Libro de Reclamaciones', 'Gestión de reclamos y quejas'],
}

interface AdminTopbarProps {
  alerts: AdminAlertItem[]
  unreadCount: number
}

export function AdminTopbar({ alerts, unreadCount }: AdminTopbarProps) {
  const pathname = usePathname()
  const { toggle } = useAdminSidebarStore()
  const [t1, t2] = TITLES[pathname] ?? ['Admin', 'Panel de administración']

  return (
    <div className="h-17 flex items-center justify-between gap-3 px-4 md:px-8 sticky top-0 z-40 border-b border-(--bd) bg-bg">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          aria-label="Abrir menú"
          className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center border border-(--bd) text-text"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <div className="font-display text-[22px] md:text-[30px] font-black uppercase tracking-[-0.5px] leading-none truncate">
            {t1}
          </div>
          <div className="text-[11px] tracking-[1px] uppercase text-muted hidden sm:block">{t2}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex text-[12px] items-center gap-2 px-3.5 py-2 text-muted border border-(--bd)">
          <Calendar size={13} />
          May 2026
        </div>
        <AlertsBell alerts={alerts} unreadCount={unreadCount} />
      </div>
    </div>
  )
}
