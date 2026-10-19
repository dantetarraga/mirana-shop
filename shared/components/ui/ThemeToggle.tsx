'use client'

import { Button } from '@/shared/components/ui/Button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { MouseEvent } from 'react'

const REVEAL_MS = 550

/**
 * Alterna entre el tema claro (por defecto) y el oscuro "Arc Reactor".
 * La preferencia es única para tienda y admin — next-themes la persiste en
 * localStorage y la aplica como clase en <html> antes del primer paint.
 *
 * Qué icono se ve lo decide CSS con la variante `dark`, no el estado de React:
 * así el botón se pinta correcto desde el servidor, sin desajuste de
 * hidratación ni un hueco vacío mientras monta.
 *
 * Al cambiar, el tema nuevo se revela en un círculo que crece desde el botón
 * (View Transitions API). Sin soporte del navegador o con movimiento reducido,
 * el cambio es instantáneo como antes.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement

    // next-themes aplica la clase en un efecto, después del render: para que la
    // captura «después» de la transición ya tenga el tema nuevo, se aplica a
    // mano aquí y next-themes solo persiste la preferencia.
    const apply = () => {
      root.classList.remove('light', 'dark')
      root.classList.add(next)
      root.style.colorScheme = next
      setTheme(next)
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      apply()
      return
    }

    // Centro del círculo: el botón (con teclado no hay coordenadas de mouse).
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    // Radio hasta la esquina más lejana de la ventana.
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const transition = document.startViewTransition(apply)
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: REVEAL_MS,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {})
  }

  return (
    <Button
      variant="icon"
      size="md"
      className={className}
      onClick={toggle}
      aria-label="Cambiar entre tema claro y oscuro"
      title="Cambiar tema"
    >
      <Moon size={17} className="dark:hidden" />
      <Sun size={17} className="hidden dark:block" />
    </Button>
  )
}
