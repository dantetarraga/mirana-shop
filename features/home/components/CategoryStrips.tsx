import type { CategoryRow } from '@/features/categories/types'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STRIPE_MAP: Record<string, string> = {
  'figuras-accion': 'stripe-fig',
  lego: 'stripe-lego',
  'modelos-escala': 'stripe-veh',
  anime: 'stripe-fig',
}

interface CategoryStripsProps {
  categories: CategoryRow[]
}

export function CategoryStrips({ categories }: CategoryStripsProps) {
  const featured = categories.slice(0, 3)

  if (featured.length === 0) return null

  return (
    <section className="shell pb-20 grid grid-cols-3 gap-4">
      {featured.map((cat) => (
        <Link
          key={cat.id}
          href={`/catalogo?cat=${cat.slug}`}
          className="no-underline cursor-pointer block"
        >
          <div
            className={`${STRIPE_MAP[cat.slug] ?? 'stripe-fig'} h-45 flex items-end px-6 pb-6 relative border border-(--bd) transition-[border-color] duration-[.25s]`}
          >
            <div>
              <div className="font-display text-[28px] font-black uppercase tracking-[-0.5px] text-text leading-none">
                {cat.name}
              </div>
              {cat.description && (
                <div className="text-[12px] text-muted mt-1 line-clamp-1">{cat.description}</div>
              )}
            </div>
            <div className="absolute top-5 right-5 font-display text-[13px] font-bold text-(--gold) tracking-[1px] uppercase inline-flex items-center hover:text-(--gold-hover) transition-colors">
              Ver
              <ArrowRight size={14} className="inline-block ml-1" strokeWidth={3} />
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}
