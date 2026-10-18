'use client'

import {
  limitMenuChildren,
  MENU_MAX_COLLECTIONS,
  MENU_OVERFLOW_LABEL,
} from '@/features/categories/lib/menu-limits'
import { QUICK_LINKS, type NavData } from '@/shared/components/layout/nav-links'
import { cn } from '@/shared/lib/utils'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Mega-menú "Tienda" del Navbar de escritorio (docs/NAVEGACION-CATALOGO.md §2).
//
// Patrón disclosure (no role="menu"): un botón con aria-expanded/aria-controls
// y un panel de enlaces normales que sigue al botón en el orden de Tab.
//   - Clic / Enter / Espacio alternan; ↓ abre y lleva el foco al primer enlace.
//   - Escape cierra y devuelve el foco al botón; clic fuera o sacar el foco
//     del menú cierra; navegar cierra.
//   - Hover con intención de 150 ms SOLO con ratón y como mejora: lo abierto
//     por hover se cierra al salir, lo abierto con clic queda fijo.
// El panel se renderiza siempre (con `hidden`): los enlaces están en el HTML
// para los buscadores y aria-controls siempre apunta a algo.
// ---------------------------------------------------------------------------

const HOVER_INTENT_MS = 150

interface MegaMenuProps {
  nav: NavData
  pathname: string
}

export function MegaMenu({ nav, pathname }: MegaMenuProps) {
  const [open, setOpen] = useState(false)
  const openedByHover = useRef(false)
  const hoverTimer = useRef<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Navegar cierra el panel (estado derivado del render anterior, sin efecto).
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setOpen(false)
  }

  const clearHoverTimer = () => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const focusFirstLink = () =>
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus())

  const onButtonClick = () => {
    clearHoverTimer()
    // Abierto por hover + clic = "fijarlo", no cerrarlo bajo el cursor.
    if (open && openedByHover.current) {
      openedByHover.current = false
      return
    }
    openedByHover.current = false
    setOpen((o) => !o)
  }

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    clearHoverTimer()
    if (open) return
    hoverTimer.current = window.setTimeout(() => {
      openedByHover.current = true
      setOpen(true)
    }, HOVER_INTENT_MS)
  }

  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    clearHoverTimer()
    if (!open || !openedByHover.current) return
    hoverTimer.current = window.setTimeout(() => setOpen(false), HOVER_INTENT_MS)
  }

  const close = () => setOpen(false)
  const collections = nav.collections.slice(0, MENU_MAX_COLLECTIONS)
  const hasAside = nav.brands.length > 0 || collections.length > 0

  return (
    // El hover es solo una mejora con ratón; el control accesible es el
    // <button> (teclado, táctil y lector de pantalla no dependen de esto).
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={wrapRef}
      className="hidden md:flex self-stretch"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onBlur={(e) => {
        // El foco pasó a otro elemento fuera del botón y del panel (Tab hacia
        // adelante o atrás). relatedTarget null = clic en una zona no
        // enfocable: de eso se encarga el pointerdown de fuera.
        const next = e.relatedTarget as Node | null
        if (open && next && !wrapRef.current?.contains(next)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onButtonClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            openedByHover.current = false
            setOpen(true)
            focusFirstLink()
          }
        }}
        className={cn(
          'relative flex items-center gap-1.5 text-[12px] font-semibold tracking-[1px] uppercase transition-colors duration-200',
          // Indicador inferior: misma línea de 2px que la barra de progreso.
          "after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-(--gold) after:transition-transform after:duration-200 after:origin-left after:content-['']",
          open ? 'text-text after:scale-x-100' : 'text-muted hover:text-text after:scale-x-0',
        )}
      >
        Tienda
        <ChevronDown
          size={14}
          aria-hidden
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full bg-surf border-b border-(--bd) shadow-pop animate-fade-in max-h-[calc(100dvh-var(--nh))] overflow-y-auto overscroll-contain"
      >
        <div
          className={cn(
            'shell py-8 grid gap-10',
            hasAside && 'grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_340px]',
          )}
        >
          <nav aria-label="Categorías">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-5 mb-6 border-b border-(--bd)">
              <Link
                href="/catalogo"
                onClick={close}
                className="inline-flex items-center gap-1.5 font-display text-[15px] font-extrabold uppercase tracking-[0.5px] text-accent-ink hover:underline underline-offset-4"
              >
                Todo el catálogo
                <ArrowRight size={14} aria-hidden strokeWidth={2.5} />
              </Link>
              {/* En lg+ Preventas/Novedades/Ofertas ya están en la barra. */}
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className={cn(
                    'text-[13px] font-semibold text-muted hover:text-text transition-colors',
                    l.bar && 'lg:hidden',
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {nav.menu.length === 0 && nav.overflow.length === 0 ? (
              <p className="text-[14px] text-muted">
                Pronto verás aquí las categorías. Mientras tanto, recorre el catálogo completo.
              </p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-x-8 gap-y-8">
                {nav.menu.map((root) => {
                  const { shown } = limitMenuChildren(root.children)
                  const href = `/categorias/${root.slug}`
                  return (
                    <li key={root.slug} className="min-w-0">
                      <Link
                        href={href}
                        onClick={close}
                        aria-current={pathname === href ? 'page' : undefined}
                        className="block font-display text-[17px] font-extrabold uppercase tracking-[0.5px] leading-tight text-text hover:text-accent-ink transition-colors mb-2.5"
                      >
                        {root.name}
                      </Link>
                      {shown.length > 0 && (
                        <ul className="flex flex-col">
                          {shown.map((child) => {
                            const childHref = `/categorias/${child.slug}`
                            return (
                              <li key={child.slug}>
                                <Link
                                  href={childHref}
                                  onClick={close}
                                  aria-current={pathname === childHref ? 'page' : undefined}
                                  className={cn(
                                    'block py-1.5 text-[14px] transition-colors truncate',
                                    pathname === childHref
                                      ? 'text-accent-ink font-semibold'
                                      : 'text-muted hover:text-text',
                                  )}
                                >
                                  {child.name}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      <Link
                        href={href}
                        onClick={close}
                        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-ink hover:underline underline-offset-4"
                      >
                        Ver todo {root.name}
                        <ArrowRight size={13} aria-hidden strokeWidth={2.5} />
                      </Link>
                    </li>
                  )
                })}

                {nav.overflow.length > 0 && (
                  <li className="min-w-0">
                    <p className="font-display text-[17px] font-extrabold uppercase tracking-[0.5px] leading-tight text-muted mb-2.5">
                      {MENU_OVERFLOW_LABEL}
                    </p>
                    <ul className="flex flex-col">
                      {nav.overflow.map((root) => (
                        <li key={root.slug}>
                          <Link
                            href={`/categorias/${root.slug}`}
                            onClick={close}
                            className="block py-1.5 text-[14px] text-muted hover:text-text transition-colors truncate"
                          >
                            {root.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            )}
          </nav>

          {hasAside && (
            <div className="border-l border-(--bd) pl-10 flex flex-col gap-8">
              {nav.brands.length > 0 && (
                <section aria-labelledby={`${panelId}-brands`}>
                  <h2
                    id={`${panelId}-brands`}
                    className="font-display text-[15px] font-extrabold uppercase tracking-[0.5px] text-text mb-3"
                  >
                    Marcas destacadas
                  </h2>
                  <ul className="grid grid-cols-2 gap-2">
                    {nav.brands.map((b) => (
                      <li key={b.slug}>
                        <Link
                          href={`/marcas/${b.slug}`}
                          onClick={close}
                          title={b.name}
                          className="relative grid place-items-center aspect-[22/9] overflow-hidden bg-card border border-(--bd) hover:border-(--bdh) transition-colors"
                        >
                          {b.imageUrl ? (
                            <Image src={b.imageUrl} alt={b.name} fill sizes="160px" className="object-cover" />
                          ) : (
                            <span className="font-display text-[14px] font-black uppercase text-text px-2 text-center leading-none">
                              {b.name}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/marcas"
                    onClick={close}
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-ink hover:underline underline-offset-4"
                  >
                    Todas las marcas
                    <ArrowRight size={13} aria-hidden strokeWidth={2.5} />
                  </Link>
                </section>
              )}

              {collections.length > 0 && (
                <section aria-labelledby={`${panelId}-collections`}>
                  <h2
                    id={`${panelId}-collections`}
                    className="font-display text-[15px] font-extrabold uppercase tracking-[0.5px] text-text mb-2"
                  >
                    Colecciones
                  </h2>
                  <ul className="flex flex-col">
                    {collections.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={close}
                          aria-current={pathname === c.href ? 'page' : undefined}
                          className="block py-1.5 text-[14px] text-muted hover:text-text transition-colors truncate"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
