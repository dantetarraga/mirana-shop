import { getMenuTree } from '@/features/categories/queries/category.queries'
import { HomeSectionHeaderSkeleton } from '@/features/home/components/HomeSectionSkeleton'
import { FadeImage } from '@/shared/components/ui/FadeImage'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// "Explora por categoría": una tile por raíz del menú que tenga imagen, en el
// orden del admin. 2 columnas en móvil, 4 en desktop, proporción fija (el
// esqueleto copia la misma grilla). Reemplaza a CategoryStrips, que tomaba
// las 3 primeras categorías de la lista sin mirar si eran raíces.
// ---------------------------------------------------------------------------

/** Filas completas en desktop: 4 u 8 tiles. */
const MAX_TILES = 8

const GRID = 'grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4'
const TILE_RATIO = 'aspect-square sm:aspect-[4/3]'

export async function CategoryTiles() {
  const roots = (await getMenuTree()).filter((c) => c.imageUrl).slice(0, MAX_TILES)
  if (roots.length === 0) return null

  return (
    <section aria-labelledby="home-category-tiles" className="shell py-14 md:py-20">
      <div className="mb-6 md:mb-8">
        <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2.5 text-accent-ink">
          Categorías
        </div>
        <h2
          id="home-category-tiles"
          className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,5vw,64px)]"
        >
          Explora por categoría
        </h2>
      </div>

      <ul className={GRID}>
        {roots.map((cat, i) => (
          <li key={cat.id}>
            <Link
              href={`/categorias/${cat.slug}`}
              className={`group relative isolate flex items-end overflow-hidden border border-(--bd) bg-skeleton no-underline ${TILE_RATIO}`}
            >
              <FadeImage
                src={cat.imageUrl!}
                alt=""
                fill
                // Las 4 primeras quedan visibles al llegar a la sección.
                loading={i < 4 ? 'eager' : 'lazy'}
                sizes="(max-width: 1023px) 50vw, 25vw"
                className="object-cover -z-10 transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              {/* Velo solo abajo: el texto va sobre --on-media en ambos temas. */}
              <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-media-scrim via-media-scrim/35 to-transparent" />
              <div className="p-3.5 sm:p-5">
                <span className="block font-display font-black uppercase tracking-[-0.5px] leading-none text-on-media text-[20px] sm:text-[26px]">
                  {cat.name}
                </span>{' '}
                <span className="block mt-1.5 text-[11px] sm:text-[12px] font-semibold text-on-media/80">
                  {cat.productCount} {cat.productCount === 1 ? 'producto' : 'productos'}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Fallback de <Suspense>: misma sección, grilla y proporción. */
export function CategoryTilesSkeleton() {
  return (
    <section className="shell py-14 md:py-20" aria-hidden>
      <HomeSectionHeaderSkeleton />
      <div className={GRID}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className={TILE_RATIO} />
        ))}
      </div>
    </section>
  )
}
