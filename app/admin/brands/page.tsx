import Link from 'next/link'
import { BrandsTableClient } from '@/features/brands/components/BrandsTableClient'
import { countBrands, getBrands } from '@/features/brands/queries/brand.queries'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Marcas — Admin Mirana' }

export default async function BrandsPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const perPage = 30

  const [brands, allBrands, total] = await Promise.all([
    getBrands({ search: q, page: currentPage, perPage }),
    getBrands({ perPage: 500 }), // para el dropdown de reasignación en EntityProductsDrawer
    countBrands({ search: q }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="px-8 pt-6 flex items-center gap-3.5 mb-0">
        <ServerSearchForm placeholder="Buscar marcas..." defaultValue={q ?? ''} paramName="q" />
        {q && (
          <Link
            href="/admin/brands"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </Link>
        )}
      </div>

      <BrandsTableClient brands={brands} total={total} allBrands={allBrands} />

      {totalPages > 1 && (
        <div className="px-8 pb-8 flex items-center gap-2 justify-end">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/brands?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
              className={`px-3 py-1.5 text-[13px] border transition-colors ${
                p === currentPage
                  ? 'bg-(--gold) border-(--gold) text-black font-bold'
                  : 'border-(--bd) text-muted hover:text-text'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
