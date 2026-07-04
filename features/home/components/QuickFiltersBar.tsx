import type { CategoryRow } from '@/features/categories/types'
import Link from 'next/link'

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
  const topCategories = [...categories]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5)

  return (
    <div className="bg-surf border-b border-(--bd)">
      <div className="shell flex items-center justify-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_LINKS.map(({ label, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={`px-5 py-3.5 text-[12px] font-display font-bold tracking-[1.5px] uppercase no-underline transition-colors duration-200 hover:bg-(--sub) ${
              accent ? 'text-(--gold) hover:text-(--gl)' : 'text-text hover:text-(--gold)'
            }`}
          >
            {label}
          </Link>
        ))}

        {topCategories.length > 0 && (
          <span className="w-px h-4 shrink-0 bg-(--bd) mx-1" aria-hidden />
        )}

        {topCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogo?cat=${cat.slug}`}
            className="px-5 py-3.5 text-[12px] font-display font-bold tracking-[1.5px] uppercase no-underline text-muted transition-colors duration-200 hover:text-text hover:bg-(--sub)"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
