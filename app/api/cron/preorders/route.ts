import { releaseArrivedPreorders } from '@/features/products/lib/preorder-release'
import { revalidatePath } from 'next/cache'
import { isCronAuthorized } from '@/shared/lib/cron-auth'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/cron/preorders — cierra las preventas cuya fecha estimada de entrega
// ya pasó: el producto deja de ser PREORDER y se vende normal (o queda
// SOLD_OUT si todavía no llegó mercadería).
//
// Protegida con CRON_SECRET (.env), igual que /api/cron/carts. En Hostinger
// (hPanel → Cron Jobs) basta con una corrida diaria con Authorization: Bearer.
//
// Es idempotente: una vez convertido el producto ya no es PREORDER, así que
// volver a ejecutarlo no hace nada.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await releaseArrivedPreorders()

    // Solo se revalida si hubo cambios: la home y el catálogo muestran el
    // estado del producto (badge PREVENTA, filtros de disponibilidad).
    if (result.available > 0 || result.soldOut > 0) {
      revalidatePath('/')
      revalidatePath('/catalogo')
      revalidatePath('/admin/products')
      revalidatePath('/admin/inventory')
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error cerrando preventas'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
