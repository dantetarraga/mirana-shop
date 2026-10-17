import { purgeExpiredCarts } from '@/features/cart/lib/cart-ttl'
import { isCronAuthorized } from '@/shared/lib/cron-auth'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/cron/carts — borra los carritos caducados (1 día sin actividad).
//
// Protegida con CRON_SECRET (.env). En Hostinger (hPanel → Cron Jobs) crear
// un job cada pocas horas (p. ej. cada 6) con Authorization: Bearer.
//
// La frecuencia solo afecta cuánto tarda en liberarse la fila: leer o escribir
// un carrito caducado ya lo trata como vacío sin esperar al cron.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await purgeExpiredCarts()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error limpiando carritos'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
