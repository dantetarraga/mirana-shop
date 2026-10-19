'use client'

import { inputCls } from '@/shared/lib/ui-classes'
import { cn } from '@/shared/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

// ---------------------------------------------------------------------------
// SelectMenu — el select de una opción de toda la interfaz, con lista propia
// (no la del navegador).
//
// Cerrado se ve como un campo (inputCls + chevron). Abierto pinta un panel con
// el estilo de la tienda; admite ícono y grupo por opción y sigue el patrón
// ARIA "select-only combobox": ↑/↓ mueven, Enter/Espacio eligen, Esc cierra,
// Inicio/Fin y búsqueda por la primera letra.
//
// Recibe `id`, `aria-invalid` y `aria-describedby` como un control nativo, así
// que funciona dentro de Field/FormField (que los inyectan con cloneElement).
// Para react-hook-form usar FormSelectMenu.
// ---------------------------------------------------------------------------

export interface SelectMenuOption<V extends string> {
  value: V
  label: string
  icon?: ReactNode
  /** Encabezado del grupo; las opciones de un mismo grupo deben ir seguidas. */
  group?: string
  disabled?: boolean
}

export interface SelectMenuProps<V extends string> {
  value: V | ''
  onChange: (value: V) => void
  options: ReadonlyArray<SelectMenuOption<V>>
  placeholder?: string
  /** id del botón (para <label htmlFor>); Field/FormField lo inyectan. */
  id?: string
  name?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
  onBlur?: () => void
  disabled?: boolean
  /** Enfoca el botón al montarse (p. ej. al aparecer en lugar de otro control). */
  autoFocus?: boolean
  /** Clases del contenedor (ancho, márgenes). */
  className?: string
  /** Clases extra del botón (tipografía, padding). */
  buttonClassName?: string
}

export function SelectMenu<V extends string>({
  value,
  onChange,
  options,
  placeholder = 'Elige una opción…',
  id,
  name,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
  onBlur,
  disabled,
  autoFocus,
  className,
  buttonClassName,
}: SelectMenuProps<V>) {
  const autoId = useId()
  const buttonId = id ?? `${autoId}-button`
  const listId = `${autoId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = options.find((o) => o.value === value)
  const enabledIndexes = options.flatMap((o, i) => (o.disabled ? [] : [i]))

  useEffect(() => {
    if (autoFocus) buttonRef.current?.focus()
  }, [autoFocus])

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
    setActive(i >= 0 ? i : (enabledIndexes[0] ?? 0))
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    onBlur?.()
  }

  const choose = (i: number) => {
    const option = options[i]
    if (!option || option.disabled) return
    onChange(option.value)
    close()
  }

  /** Siguiente opción habilitada en la dirección indicada. */
  const step = (from: number, dir: 1 | -1) => {
    const pos = enabledIndexes.indexOf(from)
    if (pos === -1) return enabledIndexes[dir === 1 ? 0 : enabledIndexes.length - 1] ?? from
    return enabledIndexes[Math.min(enabledIndexes.length - 1, Math.max(0, pos + dir))] ?? from
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || enabledIndexes.length === 0) return

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
        setActive((i) => step(i, 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => step(i, -1))
        break
      case 'Home':
        e.preventDefault()
        setActive(enabledIndexes[0])
        break
      case 'End':
        e.preventDefault()
        setActive(enabledIndexes[enabledIndexes.length - 1])
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close()
        break
      default:
        // Búsqueda por la primera letra, empezando después de la activa.
        if (e.key.length === 1) {
          const key = e.key.toLowerCase()
          const order = [
            ...enabledIndexes.filter((i) => i > active),
            ...enabledIndexes.filter((i) => i <= active),
          ]
          const hit = order.find((i) => options[i].label.toLowerCase().startsWith(key))
          if (hit !== undefined) setActive(hit)
        }
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        id={buttonId}
        name={name}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          inputCls,
          'flex items-center gap-2.5 pr-9 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
          buttonClassName,
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
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto border border-(--bd) bg-card py-1 shadow-lg animate-fade-in"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value
            const startsGroup = option.group && option.group !== options[i - 1]?.group
            return (
              <Fragment key={option.value}>
                {startsGroup && (
                  <li
                    role="presentation"
                    className="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-muted select-none"
                  >
                    {option.group}
                  </li>
                )}
                {/* El teclado lo maneja el botón (aria-activedescendant): las
                    opciones no reciben foco, así que no llevan onKeyDown. */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                <li
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  // mousedown + preventDefault: el foco se queda en el botón.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  onMouseEnter={() => !option.disabled && setActive(i)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 min-h-10 py-2 text-[14px] text-text',
                    option.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
                    i === active && !option.disabled && 'bg-(--sub)',
                  )}
                >
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="flex-1">{option.label}</span>
                  {isSelected && (
                    <Check size={15} aria-hidden className="shrink-0 text-accent-ink" />
                  )}
                </li>
              </Fragment>
            )
          })}
        </ul>
      )}
    </div>
  )
}
