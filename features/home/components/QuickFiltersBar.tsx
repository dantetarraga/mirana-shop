'use client'

import type { CategoryRow } from '@/features/categories/types'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

interface QuickFiltersBarProps {
  categories: CategoryRow[]
}

const QUICK_LINKS = [
  { label: 'Preventas', href: '/catalogo?avail=preorder', accent: true },
  { label: 'Novedades', href: '/catalogo?sort=newest', accent: false },
  { label: 'En Stock', href: '/catalogo?avail=in_stock', accent: false },
  { label: 'Ofertas', href: '/catalogo?oferta=1', accent: true },
]

export function QuickFiltersBar({ categories }: QuickFiltersBarProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  // Solo las categorías raíz (sin padre), ordenadas por popularidad
  const parents = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5)

  // Mapa parentId → hijos para O(1) lookup
  const childrenByParent = new Map<string, CategoryRow[]>()
  for (const cat of categories) {
    if (cat.parentId !== null) {
      if (!childrenByParent.has(cat.parentId)) childrenByParent.set(cat.parentId, [])
      childrenByParent.get(cat.parentId)!.push(cat)
    }
  }

  const handleTriggerEnter = (catId: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const barRect = barRef.current?.getBoundingClientRect()
    // left relativo al borde izquierdo del div exterior (full-width)
    if (barRect) setDropdownLeft(rect.left - barRect.left)
    setOpenId(catId)
  }

  const openChildren = openId ? (childrenByParent.get(openId) ?? []) : []

  return (
    <div
      ref={barRef}
      className="relative bg-surf border-b border-(--bd)"
      onMouseLeave={() => setOpenId(null)}
    >
      {/* ── Barra scrolleable ── */}
      <div className="shell flex items-center justify-start sm:justify-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_LINKS.map(({ label, href, accent }) => (
          <Link
            key={label}
            href={href}
            onMouseEnter={() => setOpenId(null)}
            className={`shrink-0 px-4 sm:px-5 py-3.5 text-[12px] font-display font-bold tracking-[1.5px] uppercase no-underline transition-colors duration-200 hover:bg-(--sub) ${
              accent ? 'text-accent-ink hover:text-(--gl)' : 'text-text hover:text-accent-ink'
            }`}
          >
            {label}
          </Link>
        ))}

        {parents.length > 0 && <span className="w-px h-4 shrink-0 bg-(--bd) mx-1" aria-hidden />}

        {parents.map((cat) => {
          const children = childrenByParent.get(cat.id) ?? []
          const hasChildren = children.length > 0
          const isOpen = openId === cat.id

          return (
            <div
              key={cat.id}
              className="shrink-0"
              onMouseEnter={(e) => (hasChildren ? handleTriggerEnter(cat.id, e) : setOpenId(null))}
            >
              <Link
                href={`/catalogo?cat=${cat.slug}`}
                className={`flex items-center gap-1 px-4 sm:px-5 py-3.5 text-[12px] font-display font-bold tracking-[1.5px] uppercase no-underline transition-colors duration-200 hover:text-text hover:bg-(--sub) ${
                  isOpen ? 'text-text bg-(--sub)' : 'text-muted'
                }`}
              >
                {cat.name}
                {hasChildren && (
                  <ChevronDown
                    size={11}
                    aria-hidden
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </Link>
            </div>
          )
        })}
      </div>

      {/* ── Dropdown — fuera del overflow-x-auto para no ser clipado ── */}
      {openId && openChildren.length > 0 && (
        <div
          className="absolute top-full z-100 min-w-[160px] bg-surf border border-t-0 border-(--bd) shadow-pop flex flex-col"
          style={{ left: dropdownLeft }}
        >
          {openChildren.map((child) => (
            <Link
              key={child.id}
              href={`/catalogo?cat=${child.slug}`}
              onClick={() => setOpenId(null)}
              className="px-5 py-2.5 text-[12px] font-display font-bold tracking-[1.5px] uppercase no-underline text-muted hover:text-text hover:bg-(--sub) transition-colors duration-150 whitespace-nowrap"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
