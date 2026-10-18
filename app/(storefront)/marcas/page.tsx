import { BrandCard } from '@/features/brands/components/BrandCard'
import { getPublicBrands } from '@/features/brands/queries/brand.queries'
import { JsonLd } from '@/shared/components/JsonLd'
import { Breadcrumbs, breadcrumbJsonLd } from '@/shared/components/layout/Breadcrumbs'
import { buttonClass } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { getSiteUrl } from '@/shared/lib/env'
import { Tags } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marcas',
  description:
    'Todas las marcas de figuras, sets y coleccionables que vende MIRANA, con sus novedades y preventas.',
  alternates: { canonical: '/marcas' },
  openGraph: { title: 'Marcas', url: '/marcas' },
}

const crumbs = [
  { label: 'Inicio', path: '/' },
  { label: 'Marcas', path: '/marcas' },
]

export default async function BrandsIndexPage() {
  // Solo marcas con algo que ver: una página de marca vacía es un callejón.
  const brands = (await getPublicBrands()).filter((b) => b.productCount > 0)
  // Destacadas en el orden del admin; el resto, de la A a la Z.
  const featured = brands.filter((b) => b.featured)
  const rest = brands
    .filter((b) => !b.featured)
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))

  const siteUrl = getSiteUrl()

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(siteUrl, crumbs)} />
      <section className="shell pb-20 pt-8 sm:pt-10">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Marcas' }]} />

        <h1 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)]">
          Marcas
        </h1>
        <p className="mt-3 mb-10 text-[15px] text-muted max-w-[60ch]">
          Elige un fabricante para ver todo lo que tenemos de él, con sus preventas y novedades.
        </p>

        {brands.length === 0 ? (
          <EmptyState
            as="h2"
            size="page"
            icon={Tags}
            title="Aún no hay marcas"
            description="Mientras tanto puedes recorrer el catálogo completo."
            action={
              <Link href="/catalogo" className={buttonClass({ variant: 'outline', size: 'md' })}>
                Ver catálogo
              </Link>
            }
          />
        ) : (
          <>
            {featured.length > 0 && (
              <section aria-labelledby="brands-featured" className="mb-12">
                <h2
                  id="brands-featured"
                  className="font-display font-black uppercase tracking-[-0.5px] text-[clamp(22px,3vw,30px)] mb-5"
                >
                  Destacadas
                </h2>
                <ul className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
                  {featured.map((b) => (
                    <li key={b.id}>
                      <BrandCard brand={b} size="lg" />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {rest.length > 0 && (
              <section aria-labelledby="brands-az">
                <h2
                  id="brands-az"
                  className="font-display font-black uppercase tracking-[-0.5px] text-[clamp(22px,3vw,30px)] mb-5"
                >
                  {featured.length > 0 ? 'Más marcas' : 'De la A a la Z'}
                </h2>
                <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                  {rest.map((b) => (
                    <li key={b.id}>
                      <BrandCard brand={b} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </section>
    </>
  )
}
