import { getActiveHomeSections } from '@/features/home-sections/queries/home-section.queries'
import { HOME_SECTION_DEFAULT_HREF } from '@/features/home-sections/types'
import { ProductCard } from '@/features/products/components/ProductCard'
import { toProductCards } from '@/features/products/lib/product-card'
import { getHideOutOfStock } from '@/features/settings/queries/store-settings.queries'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Secciones creadas en /admin/sections. Se pintan con la misma cabecera y la
// misma grilla que Novedades, pero la lista no se calcula: son los productos
// que el admin enlazó desde cada ficha.
// ---------------------------------------------------------------------------

export async function HomeSections() {
  const sections = await getActiveHomeSections(await getHideOutOfStock())

  if (sections.length === 0) return null

  return (
    <>
      {sections.map((section) => {
        const items = toProductCards(section.products)

        return (
          <section key={section.id} className="shell py-14 md:py-20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 md:mb-8">
              <div>
                {section.eyebrow && (
                  <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2.5 text-accent-ink">
                    {section.eyebrow}
                  </div>
                )}
                <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,5vw,64px)]">
                  {section.title}
                </h2>
              </div>
              <Link
                href={section.ctaHref || HOME_SECTION_DEFAULT_HREF}
                className="font-display text-[15px] font-bold tracking-[1px] uppercase pb-0.5 text-muted hover:text-accent-ink transition-colors duration-300 inline-flex items-center"
              >
                Ver todos
                <ArrowRight className="ml-1" size={14} />
              </Link>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}
