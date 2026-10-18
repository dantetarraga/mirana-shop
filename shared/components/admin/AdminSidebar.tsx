'use client'

import { useAdminSidebarStore } from '@/shared/stores/admin-sidebar.store'
import { cn } from '@/shared/lib/utils'
import {
  Archive,
  ArrowLeft,
  BadgePercent,
  BookText,
  FileText,
  Images,
  Megaphone,
  MessageSquareText,
  Settings,
  FolderTree,
  Image,
  LayoutDashboard,
  LayoutList,
  Package,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useSyncExternalStore } from 'react'

// El sidebar es un drawer solo debajo de `lg`; en desktop siempre está visible.
const DESKTOP_QUERY = '(min-width: 1024px)'
function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches
// En servidor se asume desktop: así el HTML nunca sale `inert`.
const getServerDesktop = () => true

type NavSection = { section: string }
type NavLink = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  /** Clave en `badges` cuyo conteo se muestra junto al enlace. */
  badge?: AdminSidebarBadge
  /** Cómo se lee el conteo: "3 pendientes". */
  badgeLabel?: string
}
type NavItem = NavSection | NavLink

/** Contadores que el layout puede pasar al sidebar (p. ej. reseñas por moderar). */
export type AdminSidebarBadge = 'reviewsPending'
export type AdminSidebarBadges = Partial<Record<AdminSidebarBadge, number>>

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
  { href: '/admin/coupons', label: 'Cupones', icon: Ticket },
  { href: '/admin/media', label: 'Imágenes', icon: Images },
  { section: 'Contenido' },
  { href: '/admin/sections', label: 'Secciones de Inicio', icon: LayoutList },
  { href: '/admin/cta', label: 'CTA de Inicio', icon: Megaphone },
  { href: '/admin/legal', label: 'Páginas legales', icon: FileText },
  { section: 'Clientes' },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  {
    href: '/admin/reviews',
    label: 'Reseñas',
    icon: MessageSquareText,
    badge: 'reviewsPending',
    badgeLabel: 'por revisar',
  },
  { href: '/admin/complaints', label: 'Libro de Reclamaciones', icon: BookText },
  { section: 'Configuración' },
  { href: '/admin/settings', label: 'Tienda', icon: Settings },
  { href: '/admin/delivery', label: 'Entregas', icon: Truck },
  { href: '/admin/trash', label: 'Papelera', icon: Trash2 },
]

export function AdminSidebar({ badges }: { badges?: AdminSidebarBadges } = {}) {
  const pathname = usePathname()
  const isOpen = useAdminSidebarStore((s) => s.isOpen)
  const close = useAdminSidebarStore((s) => s.close)
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop)
  const asideRef = useRef<HTMLElement>(null)
  // Cerrado en móvil está fuera de pantalla: sin `inert` el Tab seguía
  // recorriendo sus ~20 enlaces invisibles antes de llegar al contenido.
  const hiddenOnMobile = !isDesktop && !isOpen
  const isDrawer = !isDesktop && isOpen

  useEffect(() => {
    if (!isDrawer) return
    // Al abrir el drawer el foco entra en él…
    asideRef.current?.querySelector<HTMLElement>('a[href]')?.focus()
    // …y Escape lo cierra.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDrawer, close])

  return (
    <>
      {isOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 w-full h-full bg-scrim lg:hidden cursor-default"
          onClick={close}
        />
      )}
      <aside
        ref={asideRef}
        inert={hiddenOnMobile}
        aria-hidden={hiddenOnMobile || undefined}
        aria-label="Menú de administración"
        className={cn(
          'w-62 fixed top-0 bottom-0 left-0 flex flex-col z-50 bg-surf border-r border-(--bd) transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-2.5 border-b border-(--bd)">
        <span className="font-display font-black text-[26px] tracking-[4px] uppercase">
          MIRA<span className="text-accent-ink">NA</span>
        </span>
        <span className="text-[11px] tracking-[2px] uppercase ml-auto px-1.75 py-0.75 text-muted border border-(--bd)">
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
                className="text-[11px] tracking-[2px] uppercase px-3 pt-3.5 pb-2 text-muted"
              >
                {(n as NavSection).section}
              </div>
            )
          }
          const link = n as NavLink
          const isActive = pathname === link.href
          // Link con estilo de botón — antes era <Link><Button/></Link>, que
          // produce <a><button> (interactivo anidado, HTML inválido).
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'ui-btn ui-btn--ghost ui-btn--sm ui-btn--full justify-start gap-3 px-3 relative no-underline',
                isActive && 'ui-btn--active',
              )}
            >
              {isActive && (
                <span aria-hidden className="absolute left-0 top-2 bottom-2 w-0.75 bg-(--gold)" />
              )}
              <link.icon size={17} className="shrink-0" aria-hidden />
              {link.label}
              {link.badge && (badges?.[link.badge] ?? 0) > 0 && (
                <span className="ml-auto min-w-5 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none tabular-nums bg-(--gold) text-on-accent">
                  {badges![link.badge]}
                  <span className="sr-only"> {link.badgeLabel}</span>
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-(--bd)">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.75 no-underline font-sans text-sm text-muted"
        >
          <ArrowLeft size={17} aria-hidden />
          Volver a la tienda
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="w-8.5 h-8.5 flex items-center justify-center font-display font-black text-[14px] shrink-0 bg-(--gold) text-on-accent">
            AD
          </div>
          <div>
            <div className="text-[13px] font-semibold">Admin Mirana</div>
            <div className="text-[11px] tracking-[1px] uppercase text-muted">Administrador</div>
          </div>
        </div>
      </div>
      </aside>
    </>
  )
}
