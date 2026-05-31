'use client'

import { Button } from '@/shared/components/ui/Button'
import { Bell, Calendar } from 'lucide-react'
import { usePathname } from 'next/navigation'

const TITLES: Record<string, [string, string]> = {
  '/admin/dashboard': ['Resumen general', 'Vista de rendimiento de la tienda'],
  '/admin/orders': ['Pedidos', 'Gestión de órdenes y envíos'],
  '/admin/products': ['Productos', 'Catálogo y fichas de producto'],
  '/admin/inventory': ['Inventario', 'Control de stock y reabastecimiento'],
  '/admin/banners': ['Banners', 'Campañas y promociones visuales'],
  '/admin/users': ['Usuarios', 'Base de clientes y segmentación'],
}

export function AdminTopbar() {
  const pathname = usePathname()
  const [t1, t2] = TITLES[pathname] ?? ['Admin', 'Panel de administración']

  return (
    <div className="h-17 flex items-center justify-between px-8 sticky top-0 z-40 border-b border-(--bd) bg-bg">
      <div>
        <div className="font-display text-[30px] font-black uppercase tracking-[-0.5px] leading-none">
          {t1}
        </div>
        <div className="text-[11px] tracking-[1px] uppercase text-muted">{t2}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[12px] flex items-center gap-2 px-3.5 py-2 text-muted border border-(--bd)">
          <Calendar size={13} />
          May 2026
        </div>
        <Button variant="icon" size="md" className="relative">
          <Bell size={17} />
          <span className="absolute top-2 right-2.25 w-1.5 h-1.5 rounded-full bg-(--gold)" />
        </Button>
      </div>
    </div>
  )
}
