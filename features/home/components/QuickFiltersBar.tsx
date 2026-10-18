import { QUICK_LINKS } from '@/shared/components/layout/nav-links'
import { ChipLink } from '@/shared/components/ui/ChipLink'

// ---------------------------------------------------------------------------
// Accesos rápidos del inicio: una fila de chips (Preventas, Novedades, En
// stock, Ofertas + las raíces del menú). Sin dropdowns: las subcategorías y
// las marcas viven en el mega-menú del Navbar y no se duplican aquí
// (docs/NAVEGACION-CATALOGO.md §2). Server component: son solo enlaces.
//
// En móvil la fila se desliza en horizontal (snap a cada chip); desde sm se
// centra y envuelve si no cabe.
// ---------------------------------------------------------------------------

interface QuickFiltersBarProps {
  /** Raíces del menú (getMenuTree), ya en el orden del admin. */
  roots: { name: string; slug: string }[]
}

export function QuickFiltersBar({ roots }: QuickFiltersBarProps) {
  return (
    <nav aria-label="Accesos rápidos" className="bg-surf border-b border-(--bd)">
      <ul className="shell flex items-center gap-2 py-2.5 overflow-x-auto snap-x scroll-px-4 sm:flex-wrap sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_LINKS.map((l) => (
          <li key={l.href} className="snap-start">
            <ChipLink href={l.href} accent={l.accent}>
              {l.label}
            </ChipLink>
          </li>
        ))}
        {roots.length > 0 && <li aria-hidden className="w-px h-5 shrink-0 bg-(--bd) mx-1" />}
        {roots.map((r) => (
          <li key={r.slug} className="snap-start">
            <ChipLink href={`/categorias/${r.slug}`}>{r.name}</ChipLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
