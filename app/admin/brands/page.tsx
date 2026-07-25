import { BrandsTableClient } from '@/features/brands/components/BrandsTableClient'
import { countBrands, getBrands } from '@/features/brands/queries/brand.queries'
import { AdminPagination } from '@/shared/components/admin/AdminPagination'
import { ADMIN_PER_PAGE } from '@/shared/lib/admin/pagination'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Marcas — Admin Mirana' }

export default async function BrandsPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const perPage = ADMIN_PER_PAGE

  const [brands, allBrands, total] = await Promise.all([
    getBrands({ search: q, page: currentPage, perPage }),
    // Lista completa para el dropdown de reasignación en EntityProductsDrawer —
    // no debe quedar limitada al tamaño de página de la tabla.
    getBrands({ perPage: 500 }),
    countBrands({ search: q }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="px-8 pt-6 flex items-center gap-3.5 flex-wrap mb-0">
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

      <AdminPagination
        page={currentPage}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        className="px-8 pb-8"
        buildHref={(p) => `/admin/brands?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
      />
    </div>
  )
}
