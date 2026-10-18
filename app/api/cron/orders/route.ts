import { expirePendingOrders } from '@/features/orders/lib/expire-orders'
import { revalidatePath } from 'next/cache'
import { isCronAuthorized } from '@/shared/lib/cron-auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await expirePendingOrders()
    if (result.expired > 0) {
      revalidatePath('/admin/orders')
      revalidatePath('/admin/dashboard')
      revalidatePath('/catalogo')
    }
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ ok: false, error: 'Error venciendo reservas' }, { status: 500 })
  }
}
