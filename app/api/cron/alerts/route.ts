import { generateAdminAlerts } from '@/features/alerts/lib/generate-alerts'
import { NextResponse, type NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// GET /api/cron/alerts — genera las alertas del admin.
//
// Protegida con CRON_SECRET (.env). En Hostinger (hPanel → Cron Jobs) crear
// dos jobs, 8:00 y 20:00, que ejecuten:
//   curl -s "https://TU-DOMINIO.com/api/cron/alerts?secret=CRON_SECRET"
// (o con header: curl -H "Authorization: Bearer CRON_SECRET" …)
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
    const result = await generateAdminAlerts()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error generando alertas'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
