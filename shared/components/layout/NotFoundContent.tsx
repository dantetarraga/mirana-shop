import { buttonClass } from '@/shared/components/ui/Button'
import { PackageX, Search } from 'lucide-react'
import Link from 'next/link'

/**
 * Cuerpo del 404 — compartido por el 404 global y el de la tienda.
 * El buscador es un <form method="get"> nativo hacia /catalogo?q=…: funciona
 * sin JavaScript y lleva directo a resultados en vez de a un callejón.
 */
export function NotFoundContent() {
  return (
    <div className="flex flex-col items-center gap-6 px-6 w-full max-w-lg">
      <PackageX size={72} strokeWidth={1} className="text-muted opacity-40" aria-hidden />
      <div className="text-center">
        <div className="font-display text-[64px] font-black leading-none text-accent-ink">404</div>
        <h1 className="font-display text-[26px] font-black uppercase tracking-tight mt-2">
          Página no encontrada
        </h1>
        <p className="text-muted text-[14px] mt-2 max-w-90 mx-auto">
          La página que buscas no existe o fue movida. Busca tu próxima pieza de colección o
          explora el catálogo.
        </p>
      </div>

      <form action="/catalogo" method="get" role="search" className="w-full flex">
        <label htmlFor="nf-search" className="sr-only">
          Buscar productos
        </label>
        <input
          id="nf-search"
          type="search"
          name="q"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Buscar figuras, marcas, colecciones…"
          className="flex-1 min-w-0 h-12 px-4 bg-card border border-(--bd) border-r-0 text-base text-text placeholder:text-muted focus:border-(--bdh)"
        />
        <button type="submit" className={buttonClass({ variant: 'accent', className: 'h-12' })}>
          <Search size={16} aria-hidden />
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/catalogo" className={buttonClass({ variant: 'outline' })}>
          Ver catálogo
        </Link>
        <Link href="/" className={buttonClass({ variant: 'ghost' })}>
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
