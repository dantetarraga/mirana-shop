import type { CatalogCollection } from '@/features/collections/types'
import { Layers, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Card de colección para el catálogo. Comparte el aspecto de ProductCard, pero
// no tiene interactividad de carrito: toda la card —incluido el botón que en un
// producto sería "Agregar al carrito"— lleva a la página de la colección, donde
// se eligen los productos. Por eso es un Server Component: solo son enlaces.
// ---------------------------------------------------------------------------

interface CollectionCardProps {
  collection: CatalogCollection
  noAnimation?: boolean
}

export function CollectionCard({ collection: c, noAnimation = false }: CollectionCardProps) {
  const href = `/colecciones/${c.slug}`

  return (
    <div className={`pcard flex flex-col${noAnimation ? '' : ' animate-fade-up'}`}>
      <Link href={href} className="block">
        <div className="relative">
          <div className="stripe-lego h-55 flex items-center justify-center relative overflow-hidden">
            {c.imageUrl ? (
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <Layers size={32} className="text-muted" aria-hidden />
            )}
          </div>
          <div className="absolute top-3 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-1.25 bg-(--gold) text-black">
            COLECCIÓN
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="text-[10px] tracking-[2px] uppercase mb-1.25 text-muted">
            {c.productCount} producto{c.productCount !== 1 ? 's' : ''}
          </div>
          <h3 className="font-display text-[21px] font-black uppercase leading-[1.05] mb-3 tracking-[-0.5px] line-clamp-2 min-h-11">
            {c.name}
          </h3>
        </div>
      </Link>

      <div className="px-4 pb-3.5 mt-auto">
        {/* Misma altura y tipografía que la fila de precio de ProductCard, para
            que los botones queden alineados entre cards del mismo grid. */}
        <div className="flex items-baseline gap-1.5 min-w-0 mb-3">
          <span className="text-[11px] text-muted uppercase tracking-[1px]">Desde</span>
          <span className="font-display text-[19px] sm:text-[26px] font-black text-(--gold) whitespace-nowrap">
            S/ {(c.fromPrice ?? 0).toFixed(2)}
          </span>
        </div>
        {/* Ocupa el lugar del botón de carrito de ProductCard: en una colección
            no se compra desde aquí, se entra a elegir. */}
        <Link
          href={href}
          className="add-btn flex items-center justify-center gap-2 no-underline"
        >
          Ver colección
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}
