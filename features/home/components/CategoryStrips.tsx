import type { CategoryRow } from '@/features/categories/types'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
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
    <section className="shell pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {featured.map((cat) => (
        <Link
          key={cat.id}
          href={`/catalogo?cat=${cat.slug}`}
          className="no-underline cursor-pointer block"
        >
          <div
            className={`${cat.imageUrl ? '' : (STRIPE_MAP[cat.slug] ?? 'stripe-fig')} h-36 sm:h-40 lg:h-45 flex items-end px-5 sm:px-6 pb-5 sm:pb-6 relative overflow-hidden border border-(--bd) transition-[border-color] duration-[.25s]`}
          >
            {cat.imageUrl && (
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                className="object-cover -z-10"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}
            {cat.imageUrl && <div className="absolute inset-0 bg-black/45 -z-10" />}
            <div>
              <div className="font-display text-[22px] sm:text-[25px] lg:text-[28px] font-black uppercase tracking-[-0.5px] text-text leading-none">
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
