import { CategoriesTableClient } from '@/features/categories/components/CategoriesTableClient'
import { countCategories, getCategories } from '@/features/categories/queries/category.queries'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Categorías — Admin Mirana' }

export default async function CategoriesPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const perPage = 30

  const [categories, allCategories, total] = await Promise.all([
    getCategories({ search: q, page: currentPage, perPage }),
    getCategories({ perPage: 500 }), // para el dropdown de reasignación en EntityProductsDrawer
    countCategories({ search: q }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="px-8 pt-6 flex items-center gap-3.5 mb-0">
        <ServerSearchForm placeholder="Buscar categorías..." defaultValue={q ?? ''} paramName="q" />
        {q && (
          <a
            href="/admin/categories"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}
      </div>

      <CategoriesTableClient categories={categories} total={total} allCategories={allCategories} />

      {/* Paginación server-side */}
      {totalPages > 1 && (
        <div className="px-8 pb-8 flex items-center gap-2 justify-end">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/categories?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
              className={`px-3 py-1.5 text-[13px] border transition-colors ${
                p === currentPage
                  ? 'bg-(--gold) border-(--gold) text-black font-bold'
                  : 'border-(--bd) text-muted hover:text-text'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
