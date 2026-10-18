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

      {/* BrandsCarousel: título + tarjetas 4:5 (1.5 en móvil, 4 en escritorio) */}
      <div className="shell pt-12 md:pt-16">
        <Skeleton className="h-9 w-40 mb-5" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              className="shrink-0 aspect-[4/5] w-[68%] min-[480px]:w-[45%] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            />
          ))}
        </div>
      </div>

      <CategoryTilesSkeleton />
      <HomeSectionSkeleton />
      <CTABandSkeleton />
    </SkeletonRegion>
  )
}
