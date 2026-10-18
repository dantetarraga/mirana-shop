import { generateAdminAlerts } from '@/features/alerts/lib/generate-alerts'
import { isCronAuthorized } from '@/shared/lib/cron-auth'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/cron/alerts — genera las alertas del admin.
//
// Protegida con CRON_SECRET (.env). En Hostinger (hPanel → Cron Jobs) crear
// dos jobs, 8:00 y 20:00, que ejecuten un POST con Authorization: Bearer.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await generateAdminAlerts()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error generando alertas'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
