import { BrandsTableClient } from '@/features/brands/components/BrandsTableClient'
import { brandRepo } from '@/modules/catalog/repositories/brand.repo'
import { ServerSearchForm } from '@/shared/components/ServerSearchForm'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Marcas — Admin Mirana' }

export default async function BrandsPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page ?? 1))
  const perPage = 30

  const [brands, allBrands, total] = await Promise.all([
    brandRepo.findAll({ search: q, page: currentPage, perPage }),
    brandRepo.findAll({ perPage: 500 }), // para el dropdown de reasignación en EntityProductsDrawer
    brandRepo.count({ search: q }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="px-8 pt-6 flex items-center gap-3.5 mb-0">
        <ServerSearchForm placeholder="Buscar marcas..." defaultValue={q ?? ''} paramName="q" />
        {q && (
          <a
            href="/admin/brands"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}
      </div>

      <BrandsTableClient brands={brands} total={total} allBrands={allBrands} />

      {totalPages > 1 && (
        <div className="px-8 pb-8 flex items-center gap-2 justify-end">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/brands?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`}
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
