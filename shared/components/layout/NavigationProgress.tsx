'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Barra de progreso de navegación — línea cyan de 2px pegada arriba.
//
// Por qué existe si ya hay loading.tsx: el esqueleto de ruta solo aparece al
// CAMBIAR de segmento. Cambiar filtros u orden en /catalogo (mismo segmento,
// otros searchParams) deja la página vieja en pantalla hasta que llega la
// nueva, sin ninguna señal de que el click funcionó.
//
// Cómo: un listener de click en captura detecta enlaces internos (mismo
// origen, sin modificadores ni target) y arranca la barra; termina cuando
// cambian pathname o searchParams. Las navegaciones por `router.push` llaman a
// `startNavigationProgress()` antes de navegar. `useLinkStatus` de Next 16 no
// sirve aquí: solo informa dentro del propio <Link>, no globalmente.
//
// Se muestra con 150 ms de retraso para no parpadear en navegaciones
// instantáneas (prefetch), y se corta a los 10 s por si la navegación muere.
// ---------------------------------------------------------------------------

const START_EVENT = 'mirana:nav-start'

/** Arranca la barra en navegaciones programáticas (`router.push`). */
export function startNavigationProgress() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(START_EVENT))
}

function isInternalNavigation(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return false
  }
  const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
  if (!anchor || (anchor.target && anchor.target !== '_self')) return false
  // `data-no-progress`: enlaces que interceptan el click sin navegar (abren un
  // modal, etc.) — sin esto la barra correría hasta el timeout.
  if (anchor.hasAttribute('download') || anchor.closest('[data-no-progress]')) return false
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  // Mismo destino (o solo cambia el #hash): no hay navegación que esperar
  const here = window.location
  return url.pathname !== here.pathname || url.search !== here.search
}

type Phase = 'idle' | 'start' | 'running' | 'done'

const STYLE: Record<Exclude<Phase, 'idle'>, CSSProperties> = {
  // Montado a escala ~0 y transparente; en el siguiente frame pasa a running
  start: { transform: 'scaleX(0.02)', opacity: 0, transition: 'none' },
  // Avanza rápido al principio y casi se detiene en 82 %: "falta poco". La
  // opacidad entra con 150 ms de retraso → en navegaciones instantáneas no se
  // llega a ver.
  running: {
    transform: 'scaleX(0.82)',
    opacity: 1,
    transition: 'transform 8s cubic-bezier(0.08, 0.7, 0.2, 1), opacity 120ms linear 150ms',
  },
  // Completa y se desvanece
  done: {
    transform: 'scaleX(1)',
    opacity: 0,
    transition: 'transform 180ms ease-out, opacity 220ms ease-out 140ms',
  },
}

function Bar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
    const start = () => {
      clear()
      setPhase('start')
      // Dos frames: el primero pinta 'start', el segundo dispara la transición
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase('running')))
      timers.current.push(window.setTimeout(() => setPhase('done'), 10_000))
    }
    const onClick = (e: MouseEvent) => {
      if (isInternalNavigation(e)) start()
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener(START_EVENT, start)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener(START_EVENT, start)
      clear()
    }
  }, [])

  // La ruta cambió: completar.
  const routeKey = `${pathname}?${searchParams.toString()}`
  const lastKey = useRef(routeKey)
  useEffect(() => {
    if (lastKey.current === routeKey) return
    lastKey.current = routeKey
    setPhase((p) => (p === 'idle' ? p : 'done'))
  }, [routeKey])

  // Tras completar, desmontar cuando terminó el fundido.
  useEffect(() => {
    if (phase !== 'done') return
    const t = window.setTimeout(() => setPhase('idle'), 400)
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'idle') return null
  return <div aria-hidden className="nav-progress" style={STYLE[phase]} />
}

export function NavigationProgress() {
  // useSearchParams exige un límite de Suspense para no forzar render dinámico
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  )
}
