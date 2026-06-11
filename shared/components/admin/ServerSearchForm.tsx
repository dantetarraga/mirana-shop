import { Search } from 'lucide-react'

interface ServerSearchFormProps {
  placeholder?: string
  defaultValue?: string
  paramName?: string
  extraParams?: Record<string, string>
}

/**
 * Formulario de búsqueda server-side.
 * Usa <form method="GET"> — navega actualizando la URL sin JS.
 * Funciona como Progressive Enhancement: opera con y sin JavaScript.
 */
export function ServerSearchForm({
  placeholder = 'Buscar...',
  defaultValue = '',
  paramName = 'q',
  extraParams = {},
}: ServerSearchFormProps) {
  return (
    <form
      method="GET"
      className="flex items-center gap-2.25 px-3.5 h-10.5 flex-1 min-w-50 max-w-85 bg-card border border-(--bd)"
    >
      <Search size={13} className="text-muted shrink-0" />
      <input
        type="search"
        name={paramName}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-sm w-full font-sans text-text"
        autoComplete="off"
      />
      {Object.entries(extraParams).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  )
}
