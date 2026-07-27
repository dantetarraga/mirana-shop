'use client'

import type { BrandRow } from '@/features/brands/types'
import type { CategoryRow } from '@/features/categories/types'
import type { CollectionRow } from '@/features/collections/types'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'

interface QuickFiltersBarProps {
  categories: CategoryRow[]
  brands?: BrandRow[]
  collections?: CollectionRow[]
}

const QUICK_LINKS = [
  { label: 'Preventas', href: '/catalogo?avail=preorder', accent: true },
  { label: 'Novedades', href: '/catalogo?sort=newest', accent: false },
  { label: 'En Stock', href: '/catalogo?avail=in_stock', accent: false },
  { label: 'Ofertas', href: '/catalogo?oferta=1', accent: true },
]

type DropdownItem = { label: string; href: string; imageUrl?: string | null }

// IDs especiales para los menús de marcas y colecciones
const BRANDS_KEY = '__brands__'
const COLLECTIONS_KEY = '__collections__'

export function QuickFiltersBar({
  categories,
  brands = [],
  collections = [],
}: QuickFiltersBarProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  // Solo las categorías raíz (sin padre), ordenadas por popularidad
  const parents = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5)

  const childrenByParent = new Map<string, CategoryRow[]>()
  for (const cat of categories) {
    if (cat.parentId !== null) {
      if (!childrenByParent.has(cat.parentId)) childrenByParent.set(cat.parentId, [])
      childrenByParent.get(cat.parentId)!.push(cat)
    }
  }

  const handleTriggerEnter = (id: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const barRect = barRef.current?.getBoundingClientRect()
    if (barRect) setDropdownLeft(rect.left - barRect.left)
    setOpenId(id)
  }

  // Resuelve los items del dropdown según qué menú está abierto
  let dropdownItems: DropdownItem[] = []
  if (openId === BRANDS_KEY) {
    dropdownItems = brands.map((b) => ({
      label: b.name,
      href: `/catalogo?brand=${b.slug}`,
      imageUrl: b.imageUrl,
    }))
  } else if (openId === COLLECTIONS_KEY) {
    dropdownItems = collections.map((c) => ({
      label: c.name,
      href: `/colecciones/${c.slug}`,
      imageUrl: c.imageUrl,
    }))
  } else if (openId) {
    dropdownItems = (childrenByParent.get(openId) ?? []).map((c) => ({
      label: c.name,
      href: `/catalogo?cat=${c.slug}`,
      imageUrl: c.imageUrl,
    }))
  }

  // Máx 3 columnas; 1 col hasta 5 items, 2 hasta 10, 3 en adelante
  const cols = dropdownItems.length <= 5 ? 1 : dropdownItems.length <= 10 ? 2 : 3

  const hasImages = dropdownItems.some((i) => i.imageUrl)

  const triggerClass = (isOpen: boolean) =>
    `flex items-center gap-1 px-4 sm:px-5 py-3.5 text-[12px] font-display font-bold tracking-[1.5px] uppercase no-underline transition-colors duration-200 hover:text-text hover:bg-(--sub) ${
      isOpen ? 'text-text bg-(--sub)' : 'text-muted'
    }`

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

        {/* Categorías padre con subcategorías */}
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
              <Link href={`/catalogo?cat=${cat.slug}`} className={triggerClass(isOpen)}>
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

        {/* Marcas */}
        {brands.length > 0 && (
          <>
            <span className="w-px h-4 shrink-0 bg-(--bd) mx-1" aria-hidden />
            <div className="shrink-0" onMouseEnter={(e) => handleTriggerEnter(BRANDS_KEY, e)}>
              <span className={triggerClass(openId === BRANDS_KEY) + ' cursor-default'}>
                Marcas
                <ChevronDown
                  size={11}
                  aria-hidden
                  className={`transition-transform duration-200 ${openId === BRANDS_KEY ? 'rotate-180' : ''}`}
                />
              </span>
            </div>
          </>
        )}

        {/* Colecciones */}
        {collections.length > 0 && (
          <div className="shrink-0" onMouseEnter={(e) => handleTriggerEnter(COLLECTIONS_KEY, e)}>
            <span className={triggerClass(openId === COLLECTIONS_KEY) + ' cursor-default'}>
              Colecciones
              <ChevronDown
                size={11}
                aria-hidden
                className={`transition-transform duration-200 ${openId === COLLECTIONS_KEY ? 'rotate-180' : ''}`}
              />
            </span>
          </div>
        )}
      </div>

      {/* ── Dropdown — fuera del overflow-x-auto para no ser clipado ── */}
      {openId && dropdownItems.length > 0 && (
        <div
          className="absolute top-full z-100 bg-surf border border-t-0 border-(--bd) shadow-pop p-1.5"
          style={{ left: dropdownLeft }}
        >
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(${hasImages ? 160 : 140}px, 1fr))`,
            }}
          >
            {dropdownItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenId(null)}
                className="flex items-center gap-2 px-3 py-2 text-[12px] font-display font-bold tracking-[1px] uppercase no-underline text-muted hover:text-text hover:bg-(--sub) transition-colors duration-150"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain shrink-0 rounded-sm"
                  />
                ) : hasImages ? (
                  // Placeholder para alinear items con y sin imagen en la misma columna
                  <span className="w-6 h-6 shrink-0" aria-hidden />
                ) : null}
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
