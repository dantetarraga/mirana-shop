'use client'

import { AUTOPLAY_TOGGLE_ATTR } from '@/features/home/components/useHeroAutoplay'
import { cn } from '@/shared/lib/utils'
import { Pause, Play } from 'lucide-react'

interface HeroAutoplayToggleProps {
  paused: boolean
  onToggle: () => void
  className?: string
}

/**
 * Pausa / reanuda el avance automático (WCAG 2.2.2). Va sobre la imagen, así
 * que usa los colores fijos de "sobre foto" en ambos temas. Área táctil de 44px.
 */
export function HeroAutoplayToggle({ paused, onToggle, className }: HeroAutoplayToggleProps) {
  const label = paused ? 'Reanudar el carrusel' : 'Pausar el carrusel'
  return (
    <button
      type="button"
      {...{ [AUTOPLAY_TOGGLE_ATTR]: '' }}
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={cn(
        'w-11 h-11 shrink-0 flex items-center justify-center bg-media-scrim/70 border border-(--bdh) text-on-media backdrop-blur-sm transition-colors duration-200 hover:border-(--gold) hover:text-(--gold)',
        className,
      )}
    >
      {paused ? <Play size={16} aria-hidden className="ml-0.5" /> : <Pause size={16} aria-hidden />}
    </button>
  )
}
