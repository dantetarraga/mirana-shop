'use client'

import { MiranaLogo } from '@/shared/components/brand/MiranaLogo'
import { logout } from '@/features/auth/lib/logout'
import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { SearchBox } from '@/features/search/components/SearchBox'
import { MegaMenu } from '@/shared/components/layout/MegaMenu'
import { MobileNavDrawer } from '@/shared/components/layout/MobileNavDrawer'
import {
  ACCOUNT_LINKS,
  EMPTY_NAV,
  QUICK_LINKS,
  type NavData,
  type NavLinkItem,
} from '@/shared/components/layout/nav-links'
import { Button } from '@/shared/components/ui/Button'
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'
import { useUser } from '@/shared/hooks/useUser'
import { cn } from '@/shared/lib/utils'
import {
  ArrowLeft,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export type { NavLinkItem }

interface NavbarProps {
  logoUrl?: string
  /** Mega-menú y drawer móvil (features/layout/queries/nav-links.queries.ts). */
  nav?: NavData
}

export function Navbar({ logoUrl, nav = EMPTY_NAV }: NavbarProps) {
  // Selectores atómicos: con `useCartStore()` el navbar se re-renderizaba con
  // cualquier cambio del carrito (líneas, escrituras en vuelo…), no solo el contador.
  const cartCount = useCartStore((s) => s.cartCount)
  const hydrated = useCartStore((s) => s.hydrated)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const openAuth = useAuthModalStore((s) => s.openAuth)
  const { user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // Al cambiar de ruta se cierran el drawer y la búsqueda móvil. Patrón de
  // "estado derivado del render anterior" (sin efecto → sin render extra).
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setDrawerOpen(false)
    setMobileSearchOpen(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cierra el menú con Escape y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  const closeMobileSearch = () => {
    setMobileSearchOpen(false)
    // Al desmontarse la fila de búsqueda el foco quedaría en <body>.
    requestAnimationFrame(() => searchButtonRef.current?.focus())
  }

  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed top-(--ab) left-0 right-0 z-200 flex items-center gap-2 sm:gap-5 md:gap-8 shell transition-[background-color] duration-300 h-(--nav-h) bg-surf/92 backdrop-blur-[28px] border-b border-(--bd)"
      >
        <div className="flex items-center self-stretch gap-1 sm:gap-4 md:gap-7 shrink-0">
          {/* Menú móvil: debajo de `md` no hay espacio para Catálogo ni el
              buscador completo, así que todo eso vive en el drawer. */}
          <Button
            variant="icon"
            size="md"
            className="md:hidden -ml-2 border-transparent"
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} aria-hidden />
          </Button>

          <Link href="/" className="flex items-center shrink-0" aria-label="Mirana — inicio">
            {/* Logo vectorial por defecto (se adapta al tema con currentColor);
                si el admin subió uno propio en Ajustes, se usa esa imagen. */}
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={150}
                height={90}
                priority
                className="h-8 sm:h-9 md:h-10 w-auto"
              />
            ) : (
              <MiranaLogo title="" className="h-7 sm:h-8 w-auto text-text" />
            )}
          </Link>
          {/* Escritorio: "Tienda" abre el mega-menú; Preventas, Novedades y
              Ofertas van sueltos desde lg (en md están dentro del panel). */}
          <MegaMenu nav={nav} pathname={pathname} />
          <ul className="hidden lg:flex items-center gap-6">
            {QUICK_LINKS.filter((l) => l.bar).map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[12px] font-semibold tracking-[1px] no-underline uppercase transition-[color] duration-200 text-muted hover:text-text"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden md:block flex-1 min-w-0 max-w-2xl mx-auto">
          <SearchBox />
        </div>
        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Buscador móvil: icono que despliega una fila a todo el ancho */}
          <Button
            ref={searchButtonRef}
            variant="icon"
            size="md"
            className="md:hidden border-transparent"
            aria-label="Buscar productos"
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search size={19} aria-hidden />
          </Button>

          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Cart */}
          <Button
            variant="icon"
            size="md"
            onClick={() => setCartOpen(true)}
            // Hasta que CartHydrator siembra el carrito del servidor no se sabe
            // cuántos artículos hay: el HTML del SSR sale siempre con 0.
            aria-label={
              !hydrated
                ? 'Carrito'
                : cartCount > 0
                  ? `Carrito, ${cartCount} artículos`
                  : 'Carrito, vacío'
            }
            className="relative max-sm:border-transparent"
          >
            <ShoppingBag size={18} aria-hidden />
            {hydrated && cartCount > 0 && (
              <span
                aria-hidden
                className="absolute top-1 right-0.5 min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center text-[11px] font-bold font-display bg-(--gold) text-on-accent"
              >
                {cartCount}
              </span>
            )}
          </Button>

          {/* User */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <Button
                ref={menuButtonRef}
                variant="accent"
                className="w-11 h-11 p-0"
                aria-label={`Menú de ${user.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {initials}
              </Button>
            ) : (
              <>
                {/* En móvil "Ingresar" es un icono: el texto no entra junto al
                    resto de controles a 390px. */}
                <Button
                  variant="icon"
                  size="md"
                  className="sm:hidden border-transparent"
                  aria-label="Ingresar"
                  onClick={() => openAuth('login')}
                >
                  <User size={19} aria-hidden />
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  className="hidden sm:inline-flex"
                  onClick={() => openAuth('login')}
                >
                  Ingresar
                </Button>
              </>
            )}

            {/* Dropdown */}
            {menuOpen && user && (
              <div className="absolute top-[calc(100%+8px)] right-0 min-w-55 z-250 bg-surf border border-(--bd) shadow-pop">
                <div className="px-4.5 py-4 border-b border-(--bd)">
                  <div className="font-display text-[16px] font-extrabold uppercase tracking-[0.5px]">
                    {user.name}
                  </div>
                  <div className="text-[11px] mt-0.5 text-muted">{user.email}</div>
                </div>

                {ACCOUNT_LINKS.map(({ label, icon: Icon, href }) => {
                  const isActive = pathname === href
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 px-4.5 py-3 text-[13px] no-underline font-sans font-semibold transition-colors duration-150',
                        isActive ? 'text-accent-ink bg-card' : 'text-text hover:bg-card',
                      )}
                    >
                      <Icon
                        size={14}
                        aria-hidden
                        className={cn('shrink-0', isActive ? 'text-accent-ink' : 'text-muted')}
                      />
                      {label}
                      {isActive && <span aria-hidden className="ml-auto w-1 h-1 rounded-full bg-(--gold)" />}
                    </Link>
                  )
                })}

                {user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="px-4.5 py-3 flex items-center gap-2.5 text-[13px] no-underline font-sans font-semibold text-accent-ink border-t border-(--bd)"
                  >
                    <LayoutGrid size={14} aria-hidden />
                    Panel Admin
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  full
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                  className="justify-start px-4.5 py-3 border-t border-(--bd)"
                >
                  <LogOut size={14} aria-hidden />
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Fila de búsqueda móvil: tapa la barra entera mientras está abierta. */}
        {mobileSearchOpen && (
          <div className="md:hidden absolute inset-0 z-10 flex items-center gap-1 shell bg-surf">
            <Button
              variant="icon"
              size="md"
              className="-ml-2 border-transparent"
              aria-label="Cerrar búsqueda"
              onClick={closeMobileSearch}
            >
              <ArrowLeft size={19} aria-hidden />
            </Button>
            <SearchBox
              focusOnMount
              onDismiss={closeMobileSearch}
              onNavigate={() => setMobileSearchOpen(false)}
              className="flex-1 min-w-0"
            />
          </div>
        )}
      </nav>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
        nav={nav}
        user={user}
        onLogin={() => {
          setDrawerOpen(false)
          openAuth('login')
        }}
        onRegister={() => {
          setDrawerOpen(false)
          openAuth('register')
        }}
      />
    </>
  )
}
