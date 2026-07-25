'use client'

import { Loader2, Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

/** Espera tras la última tecla antes de navegar. */
const DEBOUNCE_MS = 350

interface ServerSearchFormProps {
  placeholder?: string
  defaultValue?: string
  paramName?: string
  extraParams?: Record<string, string>
}

/**
 * Buscador de las tablas del admin. El filtrado sigue siendo server-side: al
 * escribir se actualiza la URL (con debounce) y el Server Component vuelve a
 * consultar. Se mantiene `<form method="GET">` como fallback sin JavaScript.
 *
 * Se navega con `replace` para no llenar el historial con cada pulsación, y
 * siempre se vuelve a la página 1 — los resultados son otros.
 */
export function ServerSearchForm({
  placeholder = 'Buscar...',
  defaultValue = '',
  paramName = 'q',
  extraParams = {},
}: ServerSearchFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [value, setValue] = useState(defaultValue)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Último valor que este input mandó a la URL. */
  const lastSent = useRef(defaultValue)

  // Si la URL cambia por fuera (botón "Limpiar", pestañas de filtro, atrás del
  // navegador) el input se sincroniza. Lo que llega como eco de lo que se está
  // escribiendo se ignora: si no, una respuesta lenta pisaría las teclas más
  // recientes.
  useEffect(() => {
    if (defaultValue !== lastSent.current) {
      lastSent.current = defaultValue
      setValue(defaultValue)
    }
  }, [defaultValue])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const navigate = (next: string) => {
    lastSent.current = next
    const params = new URLSearchParams(extraParams)
    if (next.trim()) params.set(paramName, next.trim())
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  const handleChange = (next: string) => {
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS)
  }

  return (
    <form
      method="GET"
      onSubmit={(e) => {
        // Con JS activo se navega en el acto; sin JS el form hace el GET normal.
        e.preventDefault()
        if (timer.current) clearTimeout(timer.current)
        navigate(value)
      }}
      className="flex items-center gap-2.25 px-3.5 h-10.5 flex-1 min-w-50 max-w-85 bg-card border border-(--bd)"
    >
      {isPending ? (
        <Loader2 size={13} className="text-muted shrink-0 animate-spin" />
      ) : (
        <Search size={13} className="text-muted shrink-0" />
      )}
      <input
        type="search"
        name={paramName}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-sm w-full font-sans text-text"
        autoComplete="off"
      />
      {/* Solo para el fallback sin JS: conserva los filtros activos en el GET */}
      {Object.entries(extraParams).map(([key, param]) => (
        <input key={key} type="hidden" name={key} value={param} />
      ))}
    </form>
  )
}
