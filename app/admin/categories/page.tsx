import Link from 'next/link'
import { CategoriesTableClient } from '@/features/categories/components/CategoriesTableClient'
import { countCategories, getCategories } from '@/features/categories/queries/category.queries'
import { AdminPagination } from '@/shared/components/admin/AdminPagination'
import { ADMIN_PER_PAGE } from '@/shared/lib/admin/pagination'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Categorías — Admin Mirana' }

export default async function CategoriesPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const perPage = ADMIN_PER_PAGE

  const [categories, allCategories, total] = await Promise.all([
    getCategories({ search: q, page: currentPage, perPage }),
    getCategories({ perPage: 500 }), // para el dropdown de reasignación en EntityProductsDrawer
    countCategories({ search: q }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="px-8 pt-6 flex items-center gap-3.5 flex-wrap mb-0">
        <ServerSearchForm placeholder="Buscar categorías..." defaultValue={q ?? ''} paramName="q" />
        {q && (
          <Link
            href="/admin/categories"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </Link>
        )}
      </div>

      <CategoriesTableClient categories={categories} total={total} allCategories={allCategories} />

      {/* Paginación server-side */}
      <AdminPagination
        page={currentPage}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        className="px-8 pb-8"
        buildHref={(p) => `/admin/categories?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
      />
    </div>
  )
}
