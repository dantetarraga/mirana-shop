import { toProductCards } from '@/features/products/services/product.mapper'
import { productRepo } from '@/features/products/services/product.service'
import { ProductCarousel } from './ProductCarousel'

interface Props {
  currentId: string
  categorySlug: string
  brandSlug: string
  collectionSlugs: string[]
}

export async function RelatedProducts({
  currentId,
  categorySlug,
  brandSlug,
  collectionSlugs,
}: Props) {
  // Prioridad: misma colección > misma marca > misma categoría
  // Hacemos las 3 queries y combinamos, deduplificando y excluyendo el producto actual

  const [byCat, byBrand, byCollection] = await Promise.all([
    productRepo.findMany({ categorySlug, take: 12 }),
    productRepo.findMany({ brandSlug, take: 12 }),
    collectionSlugs.length > 0
      ? productRepo.findMany({ collectionSlug: collectionSlugs, take: 12 })
      : Promise.resolve([]),
  ])

  // Combinar: colección > marca > categoría; dedup + excluir actual; max 10
  const seen = new Set<string>()
  const merged = [...byCollection, ...byBrand, ...byCat]
    .filter((p) => {
      if (p.id === currentId) return false
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    .slice(0, 10)

  if (merged.length === 0) return null

  const items = toProductCards(merged)

  return (
    <section className="px-6 py-16 border-t border-(--bd)">
      <div className="max-w-360 mx-auto">
        <div className="mb-8">
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2.5 text-(--gold)">
            También te puede gustar
          </div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(28px,4vw,48px)]">
            Productos relacionados
          </h2>
        </div>

        <div className="relative px-6">
          <ProductCarousel key={currentId} items={items} />
        </div>
      </div>
    </section>
  )
}
