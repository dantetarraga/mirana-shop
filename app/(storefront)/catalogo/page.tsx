import { CollectionCard } from '@/features/collections/components/CollectionCard'
import { getPublicCollections } from '@/features/collections/queries/collection.queries'
import { CatalogBrowser } from '@/features/products/components/CatalogBrowser'
import {
  hasProductFilters,
  legacyCatalogRedirect,
  parseCatalogParams,
  type RawCatalogSearchParams,
} from '@/features/products/lib/catalog-params'
import { getHideOutOfStock } from '@/features/settings/queries/store-settings.queries'
import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<RawCatalogSearchParams>
}

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Todo el catálogo de MIRANA: figuras de colección, sets LEGO, anime y modelos a escala.',
  // Canonical siempre a /catalogo sin query: el listado filtrado no se indexa
  // como URL propia (combinatoria de filtros). Categoría y marca tienen ahora
  // sus páginas indexables (/categorias/x, /marcas/x).
  alternates: { canonical: '/catalogo' },
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const raw = await searchParams

  // URLs antiguas `?cat=x` / `?brand=x` (enlaces externos, banners, Google):
  // 308 a la página propia para que el valor SEO se transfiera.
  const legacy = legacyCatalogRedirect(raw)
  if (legacy) permanentRedirect(legacy)

  const params = parseCatalogParams(raw)

  // Las colecciones encabezan la primera página, pero solo sin filtros: los
  // filtros son propiedades de producto y no se pueden aplicar a una colección
  // sin mentir sobre lo que contiene.
  const showCollections = !hasProductFilters(params) && params.page === 1
  const collections = showCollections ? await getPublicCollections(await getHideOutOfStock()) : []

  return (
    <section className="shell pb-20 pt-9">
      <p className="text-[10px] font-bold tracking-[3px] uppercase mb-1.5 text-accent-ink">
        Tienda completa
      </p>
      <h1 className="font-display font-black uppercase tracking-[-1px] m-0 mb-6 leading-[0.95] text-[clamp(36px,5vw,64px)]">
        Catálogo
      </h1>

      <CatalogBrowser
        params={params}
        basePath="/catalogo"
        showCategoryFilter
        showBrandFilter
        leading={collections.map((c) => (
          <CollectionCard key={c.id} collection={c} />
        ))}
      />
    </section>
  )
}
