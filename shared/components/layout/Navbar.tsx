'use client'

import { useAuthModalStore } from '@/features/auth/stores/auth-modal.store'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { SearchBox } from '@/features/search/components/SearchBox'
import { Button } from '@/shared/components/ui/Button'
import { useUser } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { LayoutGrid, LogOut, MapPin, Package, ShoppingBag, User } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function Navbar() {
  const { cartCount, setCartOpen } = useCartStore()
  const { openAuth } = useAuthModalStore()
  const { user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

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

  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  return (
    <nav className="fixed top-0 left-0 right-0 z-200 flex items-center gap-3 sm:gap-5 md:gap-8 shell transition-[background] duration-300 h-(--nh) bg-[rgba(3,4,9,.92)] backdrop-blur-[28px] border-b border-(--bd)">
      <div className="flex items-center gap-4 md:gap-7 shrink-0">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.svg"
            alt="Mirana"
            width={150}
            height={90}
            priority
            className="h-8 sm:h-9 md:h-10 w-auto"
          />
        </Link>
        <Link
          href="/catalogo"
          className="hidden sm:inline-block text-[12px] font-semibold tracking-[1px] no-underline uppercase transition-[color] duration-200 pb-1 border-b border-transparent text-muted hover:text-text"
        >
          Catálogo
        </Link>
      </div>

      <div className="flex-1 min-w-0 max-w-2xl mx-auto">
        <SearchBox />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Cart */}
        <Button
          variant="icon"
          size="md"
          onClick={() => setCartOpen(true)}
          aria-label={cartCount > 0 ? `Carrito, ${cartCount} artículos` : 'Carrito, vacío'}
          className="relative"
        >
          <ShoppingBag size={17} />
          {cartCount > 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold font-display bg-(--gold) text-black"
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
              className="w-10 h-10 p-0"
              aria-label={`Menú de ${user.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {initials}
            </Button>
          ) : (
            <Button variant="accent" size="md" onClick={() => openAuth('login')}>
              Ingresar
            </Button>
          )}

          {/* Dropdown */}
          {menuOpen && user && (
            <div className="absolute top-[calc(100%+8px)] right-0 min-w-55 z-250 bg-surf border border-(--bd) shadow-[0_16px_48px_rgba(0,0,0,.4)]">
              <div className="px-4.5 py-4 border-b border-(--bd)">
                <div className="font-display text-[16px] font-extrabold uppercase tracking-[0.5px]">
                  {user.name}
                </div>
                <div className="text-[11px] mt-0.5 text-muted">{user.email}</div>
              </div>

              {[
                { label: 'Mi perfil', icon: User, href: '/cuenta/perfil' },
                { label: 'Mis pedidos', icon: Package, href: '/cuenta/pedidos' },
                { label: 'Mis direcciones', icon: MapPin, href: '/cuenta/direcciones' },
              ].map(({ label, icon: Icon, href }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-4.5 py-2.75 text-[13px] no-underline font-sans font-semibold transition-colors duration-150',
                      isActive ? 'text-(--gold) bg-card' : 'text-text hover:bg-card',
                    )}
                  >
                    <Icon
                      size={14}
                      className={cn('shrink-0', isActive ? 'text-(--gold)' : 'text-muted')}
                    />
                    {label}
                    {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-(--gold)" />}
                  </Link>
                )
              })}

              {user.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4.5 py-2.75 flex items-center gap-2.5 text-[13px] no-underline font-sans font-semibold text-(--gold) border-t border-(--bd)"
                >
                  <LayoutGrid size={14} />
                  Panel Admin
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                full
                onClick={() => {
                  signOut({ callbackUrl: '/' })
                  setMenuOpen(false)
                }}
                className="justify-start px-4.5 border-t border-(--bd)"
              >
                <LogOut size={14} />
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
