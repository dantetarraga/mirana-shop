import { Button } from '@/shared/components/ui/Button'
import { PackageX } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-bg text-text">
      <PackageX size={80} strokeWidth={1} className="opacity-20" />
      <div className="text-center">
        <div className="font-display text-[64px] font-black leading-none text-(--gold)">404</div>
        <h1 className="font-display text-[26px] font-black uppercase tracking-tight mt-2">
          Página no encontrada
        </h1>
        <p className="text-muted text-[14px] mt-2 max-w-90">
          La página que buscas no existe o fue movida. Explora el catálogo para encontrar tu
          próxima pieza de colección.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/catalogo">
          <Button variant="accent" size="md">
            Ver catálogo
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            Ir al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
