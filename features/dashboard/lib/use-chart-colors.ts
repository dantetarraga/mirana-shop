'use client'

import { useSyncExternalStore } from 'react'

// ---------------------------------------------------------------------------
// Resuelve custom properties del tema a colores literales para recharts.
//
// recharts escribe `stroke`/`fill` como atributos de presentación SVG, y ahí
// `var(--x)` no funciona. Este hook lee los valores con getComputedStyle y se
// vuelve a suscribir cuando next-themes cambia la clase de <html>, así los
// gráficos siguen al tema claro/oscuro sin recargar.
// ---------------------------------------------------------------------------

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => obs.disconnect()
}

// Snapshot estable: la clase del <html> identifica el tema.
const getSnapshot = () => document.documentElement.className
const getServerSnapshot = () => ''

/** Fallbacks (tema oscuro) para el render del servidor y vars inexistentes. */
const FALLBACK: Record<string, string> = {
  '--accent-ink': '#50e0ff',
  '--gold': '#00c8ff',
  '--c-blue': '#8b7cff',
  '--c-violet': '#c77cff',
  '--c-green': '#3fcf7f',
  '--c-amber': '#ffb84a',
  '--c-red': '#ff6644',
  '--bd': 'rgba(0,200,255,.12)',
}

export function resolveCssVar(name: string): string {
  if (typeof document === 'undefined') return FALLBACK[name] ?? 'currentColor'
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || FALLBACK[name] || 'currentColor'
}

/** `useChartColors(['--accent-ink', '--c-blue'])` → ['#006ba3', '#5b4bd6'] */
export function useChartColors<T extends readonly string[]>(names: T): string[] {
  // Se lee solo para re-renderizar cuando cambia el tema
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return names.map(resolveCssVar)
}

/** Acepta un color literal o el nombre de una custom property (`--c-blue`). */
export function useChartColor(colorOrVar: string): string {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return colorOrVar.startsWith('--') ? resolveCssVar(colorOrVar) : colorOrVar
}
