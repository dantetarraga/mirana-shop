'use client'

import { SelectMenu } from '@/shared/components/ui/SelectMenu'
import { cn } from '@/shared/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface FilterMultiSelectProps {
  label: string
  options: { label: string; value: string }[]
  selected: string[]
  onToggle: (value: string) => void
  singleSelect?: boolean
  className?: string
  /** Los inyecta FormField; se pasan al control en modo singleSelect. */
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function FilterMultiSelect(props: FilterMultiSelectProps) {
  const {
    label,
    options,
    selected,
    onToggle,
    singleSelect = false,
    className,
    id,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
  } = props
  // Una sola opción = campo de formulario: se pinta con SelectMenu, el select
  // de toda la interfaz. El modo de varias opciones sigue siendo el botón de
  // filtro de las tablas del admin.
  if (singleSelect) {
    return (
      <SelectMenu
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-label={id ? undefined : label}
        value={selected[0] ?? ''}
        onChange={onToggle}
        options={options}
        placeholder={label}
        className={className}
      />
    )
  }
  return <MultiFilter {...props} />
}

function MultiFilter({
  label,
  options,
  selected,
  onToggle,
  singleSelect = false,
  className,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = selected.length > 0
  const selectedLabel = singleSelect
    ? options.find((o) => o.value === selected[0])?.label
    : undefined

  const handleToggle = (val: string) => {
    onToggle(val)
    if (singleSelect) setOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-1.5 px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
          isActive
            ? 'bg-(--gold) border-(--gold) text-on-accent'
            : 'border-(--bd) text-muted hover:text-text',
        )}
      >
        <span className="flex-1 text-left truncate">
          {singleSelect && selectedLabel ? selectedLabel : label}
        </span>
        {!singleSelect && selected.length > 0 && (
          <span
            className={cn(
              'flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black shrink-0',
              isActive ? 'bg-on-accent/15 text-on-accent' : 'bg-(--sub) text-muted',
            )}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={9}
          className={cn('transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-card border border-(--bd) min-w-full max-h-60 overflow-y-auto shadow-lg">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-(--sub) cursor-pointer"
            >
              <input
                type={singleSelect ? 'radio' : 'checkbox'}
                checked={selected.includes(opt.value)}
                onChange={() => handleToggle(opt.value)}
                className="accent-accent-ink w-3.5 h-3.5 shrink-0"
              />
              <span className="text-[13px] text-text leading-none">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
