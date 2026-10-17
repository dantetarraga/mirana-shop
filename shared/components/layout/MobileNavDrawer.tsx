'use client'

import { logout } from '@/features/auth/lib/logout'
import type { SessionUser } from '@/shared/hooks/useUser'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { ACCOUNT_LINKS, type NavLinkItem } from '@/shared/components/layout/nav-links'
import { Button, buttonClass } from '@/shared/components/ui/Button'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'
import { cn } from '@/shared/lib/utils'
import { LayoutGrid, LogOut, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

const SHOP_LINKS: NavLinkItem[] = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Novedades', href: '/catalogo?sort=newest' },
  { label: 'Preventas', href: '/catalogo?avail=preorder' },
  { label: 'Ofertas', href: '/catalogo?oferta=1' },
]

/** Regiones que quedan inertes mientras el drawer está abierto. */
const INERT_SELECTORS = ['nav[aria-label="Principal"]', '#main', 'footer']

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  pathname: string
  categories: NavLinkItem[]
  collections: NavLinkItem[]
  user: SessionUser | null
  onLogin: () => void
  onRegister: () => void
}

/**
 * Menú de navegación móvil (< md). Antes, debajo de 640px no había ninguna
 * forma de llegar al catálogo: el enlace era `hidden sm:block` y no existía menú.
 *
 * Diálogo modal: atrapa el foco, Escape cierra (y el foco vuelve al botón
 * hamburguesa vía useFocusTrap), bloquea el scroll y deja el resto inerte.
 */
export function MobileNavDrawer(props: MobileNavDrawerProps) {
  if (!props.open) return null
  return createPortal(<DrawerPanel {...props} />, document.body)
}

function DrawerPanel({
  onClose,
  pathname,
  categories,
  collections,
  user,
  onLogin,
  onRegister,
}: MobileNavDrawerProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true)
  const titleId = useId()
  useScrollLock(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    // `inert` saca el fondo del árbol de accesibilidad y del orden de Tab
    // (aria-modal solo no basta en VoiceOver/TalkBack).
    const nodes = new Set<HTMLElement>()
    for (const sel of INERT_SELECTORS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (!panelRef.current?.contains(el)) nodes.add(el)
      })
    }
    nodes.forEach((el) => el.setAttribute('inert', ''))

    return () => {
      window.removeEventListener('keydown', onKey)
      nodes.forEach((el) => el.removeAttribute('inert'))
    }
  }, [onClose, panelRef])

  const linkCls = (href: string) =>
    cn(
      'flex items-center min-h-11 px-5 text-[15px] font-semibold no-underline transition-colors duration-150',
      pathname === href ? 'text-accent-ink bg-card'
        : 'text-text hover:bg-card',
    )

  const sectionTitle = 'px-5 pt-5 pb-2 text-[11px] font-bold tracking-[2px] uppercase text-muted'

  return (
    <div className="fixed inset-0 z-400 md:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-scrim backdrop-blur-[6px] animate-fade-in cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute top-0 bottom-0 left-0 w-[min(86vw,340px)] bg-surf border-r border-(--bd) shadow-pop flex flex-col animate-slide-left pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between h-(--nav-h) pl-5 pr-2 border-b border-(--bd) shrink-0">
          <h2 id={titleId} className="font-display text-[20px] font-black uppercase tracking-[0.5px]">
            Menú
          </h2>
          <Button variant="icon" size="md" className="border-transparent" aria-label="Cerrar menú" onClick={onClose}>
            <X size={20} aria-hidden />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
          <nav aria-label="Tienda">
            <div className={sectionTitle}>Tienda</div>
            <ul>
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    aria-current={pathname === l.href ? 'page' : undefined}
                    className={linkCls(l.href)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {categories.length > 0 && (
              <>
                <div className={sectionTitle}>Categorías</div>
                <ul>
                  {categories.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={onClose} className={linkCls(l.href)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {collections.length > 0 && (
              <>
                <div className={sectionTitle}>Colecciones</div>
                <ul>
                  {collections.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={onClose}
                        aria-current={pathname === l.href ? 'page' : undefined}
                        className={linkCls(l.href)}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>

          <div className="mt-4 border-t border-(--bd)">
            <div className={sectionTitle}>Mi cuenta</div>
            {user ? (
              <ul>
                {ACCOUNT_LINKS.map(({ label, icon: Icon, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      aria-current={pathname === href ? 'page' : undefined}
                      className={cn(linkCls(href), 'gap-3')}
                    >
                      <Icon size={16} aria-hidden className="text-muted shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
                {user.role === 'admin' && (
                  <li>
                    <Link
                      href="/admin/dashboard"
                      onClick={onClose}
                      className={cn(linkCls('/admin/dashboard'), 'gap-3 text-accent-ink')}
                    >
                      <LayoutGrid size={16} aria-hidden className="shrink-0" />
                      Panel Admin
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      logout()
                    }}
                    className="flex items-center gap-3 w-full min-h-11 px-5 text-[15px] font-semibold text-muted hover:text-text hover:bg-card transition-colors"
                  >
                    <LogOut size={16} aria-hidden className="shrink-0" />
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            ) : (
              <div className="px-5 flex flex-col gap-2.5">
                <Button variant="accent" size="md" full onClick={onLogin}>
                  Ingresar
                </Button>
                <button type="button" onClick={onRegister} className={buttonClass({ variant: 'outline', full: true })}>
                  Crear cuenta
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-t border-(--bd)">
          <span className="text-[13px] text-muted">Tema</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
