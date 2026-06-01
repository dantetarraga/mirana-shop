'use client'

import { Button } from '@/shared/components/ui/Button'
import {
  Archive,
  ArrowLeft,
  BadgePercent,
  FolderTree,
  Image,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Tag,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type NavSection = { section: string }
type NavLink = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}
type NavItem = NavSection | NavLink

const NAV_ITEMS: NavItem[] = [
  { section: 'Principal' },
  { href: '/admin/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { section: 'Catálogo' },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/collections', label: 'Colecciones', icon: Star },
  { href: '/admin/brands', label: 'Marcas', icon: Tag },
  { href: '/admin/categories', label: 'Categorías', icon: FolderTree },
  { href: '/admin/inventory', label: 'Inventario', icon: Archive },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/promotions', label: 'Promociones', icon: BadgePercent },
  { section: 'Clientes' },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-62 fixed top-0 bottom-0 left-0 flex flex-col z-50 bg-surf border-r border-(--bd)">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-2.5 border-b border-(--bd)">
        <span className="font-display font-black text-[26px] tracking-[4px] uppercase">
          MIRA<span className="text-(--gold)">NA</span>
        </span>
        <span className="text-[9px] tracking-[2px] uppercase ml-auto px-1.75 py-0.75 text-muted border border-(--bd)">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4.5 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((n, i) => {
          if ('section' in n) {
            return (
              <div
                key={i}
                className="text-[9px] tracking-[2px] uppercase px-3 pt-3.5 pb-2 text-muted"
              >
                {(n as NavSection).section}
              </div>
            )
          }
          const link = n as NavLink
          return (
            <Link key={link.href} href={link.href} className="no-underline">
              <Button
                variant="ghost"
                size="sm"
                full
                active={pathname === link.href}
                className="justify-start gap-3 px-3 relative"
              >
                {pathname === link.href && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.75 bg-(--gold)" />
                )}
                <link.icon size={17} className="shrink-0" />
                {link.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-(--bd)">
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-2.75 no-underline font-sans text-sm text-muted"
        >
          <ArrowLeft size={17} />
          Volver a la tienda
        </a>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="w-8.5 h-8.5 flex items-center justify-center font-display font-black text-[14px] shrink-0 bg-(--gold) text-black">
            AD
          </div>
          <div>
            <div className="text-[13px] font-semibold">Admin Mirana</div>
            <div className="text-[10px] tracking-[1px] uppercase text-muted">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
