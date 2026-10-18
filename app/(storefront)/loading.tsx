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
// banners por defecto (CARD): accesos rápidos → marcas → carrusel de banners →
// franja promo → categorías → secciones de productos.
// ---------------------------------------------------------------------------

export default function StorefrontLoading() {
  return (
    <SkeletonRegion label="Cargando la tienda…">
      {/* QuickFiltersBar: bg-surf + borde, chips h-10 con py-2.5 (60px) */}
      <div className="bg-surf border-b border-(--bd)">
        <div className="shell flex items-center justify-start sm:justify-center gap-2 overflow-hidden py-2.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-24 shrink-0" />
          ))}
        </div>
      </div>

      {/* BrandsCarousel: celdas w-32 h-14 / sm:w-44 sm:h-18 */}
      <div className="bg-surf border-b border-(--bd) h-14 sm:h-18 flex items-center overflow-hidden px-10">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="shrink-0 w-32 sm:w-44 flex justify-center">
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

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

      <CategoryTilesSkeleton />
      <HomeSectionSkeleton />
      <CTABandSkeleton />
    </SkeletonRegion>
  )
}
