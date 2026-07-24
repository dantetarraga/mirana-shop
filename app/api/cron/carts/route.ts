import { purgeExpiredCarts } from '@/features/cart/lib/cart-ttl'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// GET /api/cron/carts — borra los carritos caducados (1 día sin actividad).
//
// Protegida con CRON_SECRET (.env). En Hostinger (hPanel → Cron Jobs) crear
// un job cada pocas horas (p. ej. cada 6) que ejecute:
//   curl -s "https://TU-DOMINIO.com/api/cron/carts?secret=CRON_SECRET"
// (o con header: curl -H "Authorization: Bearer CRON_SECRET" …)
//
// La frecuencia solo afecta cuánto tarda en liberarse la fila: leer o escribir
// un carrito caducado ya lo trata como vacío sin esperar al cron.
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
    const result = await purgeExpiredCarts()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error limpiando carritos'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
