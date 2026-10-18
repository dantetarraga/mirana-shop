import { NotFoundContent } from '@/shared/components/layout/NotFoundContent'

// 404 dentro de la tienda (producto o colección inexistente): se renderiza
// dentro del layout del storefront, así que navbar, footer y carrito siguen
// disponibles para seguir comprando.
export default function StorefrontNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16">
      <NotFoundContent />
    </div>
  )
}
