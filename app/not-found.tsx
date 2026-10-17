import { NotFoundContent } from '@/shared/components/layout/NotFoundContent'

// 404 de rutas que no existen (sin navbar ni footer: fuera de cualquier
// layout de grupo). Los `notFound()` de la tienda los atiende
// app/(storefront)/not-found.tsx, que sí conserva la navegación.
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <NotFoundContent />
    </div>
  )
}
