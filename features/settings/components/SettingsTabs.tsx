'use client'

import { cn } from '@/shared/lib/utils'
import { LayoutList, Link2, Scale, Settings2, Wallet, type LucideIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useState, type KeyboardEvent } from 'react'

// ---------------------------------------------------------------------------
// Pestañas de /admin/settings. Antes las cinco secciones iban una debajo de
// otra y había que hacer scroll para encontrar la que se quería cambiar. La
// pestaña activa vive en `?tab=` para poder recargar o compartir el enlace.
// ---------------------------------------------------------------------------

export const SETTINGS_TABS = [
  { id: 'general', label: 'General', Icon: Settings2 },
  { id: 'proveedor', label: 'Datos del proveedor', Icon: Scale },
  { id: 'inicio', label: 'Bloques del inicio', Icon: LayoutList },
  { id: 'footer', label: 'Footer y redes', Icon: Link2 },
  { id: 'pagos', label: 'Métodos de pago', Icon: Wallet },
] as const satisfies ReadonlyArray<{ id: string; label: string; Icon: LucideIcon }>

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id']

function isTabId(value: string | null): value is SettingsTabId {
  return SETTINGS_TABS.some((t) => t.id === value)
}

/** Pestaña activa leída de `?tab=` y actualizada sin recargar ni pedir al servidor. */
export function useSettingsTab(): [SettingsTabId, (tab: SettingsTabId) => void] {
  const params = useSearchParams()
  const fromUrl = params.get('tab')
  const [tab, setTabState] = useState<SettingsTabId>(isTabId(fromUrl) ? fromUrl : 'general')

  const setTab = useCallback((next: SettingsTabId) => {
    setTabState(next)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    // replaceState: cambiar de pestaña no debe llenar el historial del navegador.
    window.history.replaceState(window.history.state, '', url)
  }, [])

  return [tab, setTab]
}

/** Barra de pestañas (patrón ARIA tablist: flechas, Inicio y Fin). */
export function SettingsTabs({
  active,
  onChange,
}: {
  active: SettingsTabId
  onChange: (tab: SettingsTabId) => void
}) {
  const focusTab = (id: SettingsTabId) => {
    onChange(id)
    document.getElementById(`settings-tab-${id}`)?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = SETTINGS_TABS.findIndex((t) => t.id === active)
    const last = SETTINGS_TABS.length - 1
    const target =
      e.key === 'ArrowRight'
        ? i === last
          ? 0
          : i + 1
        : e.key === 'ArrowLeft'
          ? i === 0
            ? last
            : i - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null
    if (target === null) return
    e.preventDefault()
    focusTab(SETTINGS_TABS[target].id)
  }

  return (
    // El foco va a cada pestaña (roving tabindex), no al contenedor.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      role="tablist"
      aria-label="Secciones de configuración"
      onKeyDown={onKeyDown}
      className="mb-6 flex gap-1 overflow-x-auto border-b border-(--bd) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SETTINGS_TABS.map(({ id, label, Icon }) => {
        const selected = id === active
        return (
          <button
            key={id}
            id={`settings-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="settings-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-2 h-11 px-3.5 text-[13px] font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
              selected ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            <Icon size={15} aria-hidden className={selected ? 'text-accent-ink' : undefined} />
            {label}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-2 -bottom-px h-0.5 bg-accent-ink transition-opacity',
                selected ? 'opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
