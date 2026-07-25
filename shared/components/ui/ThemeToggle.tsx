'use client'

import { Button } from '@/shared/components/ui/Button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

/**
 * Alterna entre el tema claro (por defecto) y el oscuro "Arc Reactor".
 * La preferencia es única para tienda y admin — next-themes la persiste en
 * localStorage y la aplica como clase en <html> antes del primer paint.
 *
 * Qué icono se ve lo decide CSS con la variante `dark`, no el estado de React:
 * así el botón se pinta correcto desde el servidor, sin desajuste de
 * hidratación ni un hueco vacío mientras monta.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="icon"
      size="md"
      className={className}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Cambiar entre tema claro y oscuro"
      title="Cambiar tema"
    >
      <Moon size={17} className="dark:hidden" />
      <Sun size={17} className="hidden dark:block" />
    </Button>
  )
}
