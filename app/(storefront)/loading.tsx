import { CategoryTilesSkeleton } from '@/features/home/components/CategoryTiles'
import {
  CTABandSkeleton,
  HomeSectionSkeleton,
} from '@/features/home/components/HomeSectionSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// Esqueleto del INICIO. Ojo: un loading.tsx de grupo cubre también las rutas
// hijas que no tienen el suyo, por eso carrito, checkout, reclamaciones y las
// páginas legales llevan loading propio (antes mostraban este hero al entrar).
//
// Copia el orden y las medidas de app/(storefront)/page.tsx con el layout de
// banners por defecto (CARD): carrusel de banners → franja promo → marcas →
// categorías → secciones de productos.
// ---------------------------------------------------------------------------

export default function StorefrontLoading() {
  return (
    <SkeletonRegion label="Cargando la tienda…">
      {/* HeroBannerCarousel: 1 banner en móvil, 3 desde md, gap-1 px-1 pt-1 */}
      <div className="flex gap-1 px-1 pt-1 overflow-hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton
            key={i}
            className={`flex-none w-full md:w-[calc((100%-8px)/3)] h-[220px] sm:h-[280px] md:h-[clamp(300px,38vw,500px)] ${
              i > 0 ? 'max-md:hidden' : ''
            }`}
          />
        ))}
      </div>

      {/* PromoBanner: py-2.75 + línea de 13px ≈ 42px */}
      <Skeleton className="h-10.5 w-full" />

      {/* BrandsCarousel: título + círculos w-28 / sm:w-36 con su nombre */}
      <div className="shell pt-12 md:pt-16">
        <Skeleton className="h-9 w-40 mb-6" />
        <div className="flex gap-6 sm:gap-8 overflow-hidden py-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="shrink-0 flex flex-col items-center gap-3">
              <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      <CategoryTilesSkeleton />
      <HomeSectionSkeleton />
      <CTABandSkeleton />
    </SkeletonRegion>
  )
}
