'use client'

import { inputCls } from '@/shared/lib/ui-classes'
import { cn } from '@/shared/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// SelectMenu — select de una opción con lista propia (no la del navegador).
//
// Cerrado se ve igual que `Select` (inputCls + chevron). Abierto pinta un panel
// con el estilo de la tienda, admite un ícono por opción y sigue el patrón
// ARIA "select-only combobox": ↑/↓ mueven, Enter/Espacio eligen, Esc cierra,
// Inicio/Fin y búsqueda por la primera letra. Usar `Select` cuando baste el
// nativo (formularios con react-hook-form); este, cuando la lista necesite
// íconos o verse como el resto de la interfaz.
// ---------------------------------------------------------------------------

export interface SelectMenuOption<V extends string> {
  value: V
  label: string
  icon?: ReactNode
}

interface SelectMenuProps<V extends string> {
  value: V | ''
  onChange: (value: V) => void
  options: ReadonlyArray<SelectMenuOption<V>>
  placeholder?: string
  /** id del botón, para un <label htmlFor>. */
  id?: string
  'aria-label'?: string
  className?: string
  disabled?: boolean
}

export function SelectMenu<V extends string>({
  value,
  onChange,
  options,
  placeholder = 'Elige una opción…',
  id,
  'aria-label': ariaLabel,
  className,
  disabled,
}: SelectMenuProps<V>) {
  const autoId = useId()
  const buttonId = id ?? `${autoId}-button`
  const listId = `${autoId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = options.find((o) => o.value === value)

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Mantener visible la opción activa al moverse con el teclado.
  useEffect(() => {
    if (!open) return
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  const openMenu = () => {
    const i = options.findIndex((o) => o.value === value)
    setActive(i >= 0 ? i : 0)
    setOpen(true)
  }

  const choose = (i: number) => {
    const option = options[i]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return
    const last = options.length - 1

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(last, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(last)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        // Búsqueda por la primera letra, empezando después de la activa.
        if (e.key.length === 1) {
          const key = e.key.toLowerCase()
          const order = [...options.slice(active + 1), ...options.slice(0, active + 1)]
          const hit = order.find((o) => o.label.toLowerCase().startsWith(key))
          if (hit) setActive(options.indexOf(hit))
        }
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          inputCls,
          'flex items-center gap-2.5 pr-9 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {selected?.icon && <span className="shrink-0 text-text">{selected.icon}</span>}
        <span className={cn('flex-1 truncate', !selected && 'text-muted')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-transform motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto border border-(--bd) bg-card py-1 shadow-lg animate-fade-in"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value
            return (
              // El teclado lo maneja el botón (aria-activedescendant): las opciones
              // no reciben foco, así que no llevan onKeyDown propio.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={option.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                // mousedown + preventDefault: el foco se queda en el botón.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex items-center gap-2.5 px-3 h-10 cursor-pointer text-[14px] text-text',
                  i === active && 'bg-(--sub)',
                )}
              >
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && <Check size={15} aria-hidden className="text-accent-ink" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
