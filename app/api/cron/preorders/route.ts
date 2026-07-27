import { releaseArrivedPreorders } from '@/features/products/lib/preorder-release'
import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// GET /api/cron/preorders — cierra las preventas cuya fecha estimada de entrega
// ya pasó: el producto deja de ser PREORDER y se vende normal (o queda
// SOLD_OUT si todavía no llegó mercadería).
//
// Protegida con CRON_SECRET (.env), igual que /api/cron/carts. En Hostinger
// (hPanel → Cron Jobs) basta con una corrida diaria:
//   curl -s "https://TU-DOMINIO.com/api/cron/preorders?secret=CRON_SECRET"
//
// Es idempotente: una vez convertido el producto ya no es PREORDER, así que
// volver a ejecutarlo no hace nada.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided =
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    req.nextUrl.searchParams.get('secret')

  if (!secret || provided !== secret) {
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
