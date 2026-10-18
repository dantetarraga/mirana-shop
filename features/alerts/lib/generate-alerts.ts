import 'server-only'
import { db } from '@/shared/lib/db'
import { Dates } from '@/shared/lib/dates'
import { formatCurrency } from '@/shared/lib/utils'
import type { AdminAlertType } from '@/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Generación de alertas del admin — invocada por /api/cron/alerts (mañana y
// noche vía cron de Hostinger). Cada corrida reemplaza las alertas NO LEÍDAS
// del mismo tipo para no acumular duplicados; las leídas quedan como historial.
// ---------------------------------------------------------------------------

const LOW_STOCK_THRESHOLD = 8
const PENDING_ORDER_HOURS = 12
const PROMO_EXPIRING_DAYS = 3
/** Reclamos sin responder que vencen dentro de N días (plazo legal: 15 días hábiles) */
const COMPLAINT_DUE_SOON_DAYS = 3
/** Las alertas leídas se conservan como historial por N días y luego se eliminan */
const READ_RETENTION_DAYS = 7

type NewAlert = { type: AdminAlertType; title: string; message: string }

export async function generateAdminAlerts(): Promise<{ generated: number; types: string[] }> {
  const alerts: NewAlert[] = []
  const now = Dates.now()

  // ── 1. Stock bajo o agotado ─────────────────────────────────────────────
  const productWhere = { deletedAt: null, status: { not: 'ARCHIVED' as const } }
  const [outCount, lowCount, worst] = await Promise.all([
    db.product.count({
      where: { ...productWhere, inventory: { availableStock: 0 } },
    }),
    db.product.count({
      where: {
        ...productWhere,
        inventory: { availableStock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
      },
    }),
    db.product.findMany({
      where: {
        ...productWhere,
        inventory: { availableStock: { lte: LOW_STOCK_THRESHOLD } },
      },
      select: { name: true, inventory: { select: { availableStock: true } } },
      orderBy: { inventory: { availableStock: 'asc' } },
      take: 5,
    }),
  ])

  if (outCount + lowCount > 0) {
    const detail = worst
      .map((p) => `${p.name} (${p.inventory?.availableStock ?? 0})`)
      .join(' · ')
    alerts.push({
      type: 'LOW_STOCK',
      title: `Inventario: ${outCount} agotado(s) y ${lowCount} con stock bajo`,
      message: `Los más críticos: ${detail}. Revisa la sección Inventario para reabastecer.`,
    })
  }

  // ── 2. Pedidos sin validar hace más de N horas ──────────────────────────
  const pendingCutoff = new Date(now.getTime() - PENDING_ORDER_HOURS * 60 * 60 * 1000)
  const pendingCount = await db.order.count({
    where: {
      status: { in: ['PENDING', 'AWAITING_PROOF'] },
      createdAt: { lt: pendingCutoff },
    },
  })

  if (pendingCount > 0) {
    alerts.push({
      type: 'PENDING_ORDERS',
      title: `${pendingCount} pedido(s) esperando validación`,
      message: `Hay ${pendingCount} pedido(s) sin validar desde hace más de ${PENDING_ORDER_HOURS} horas. Revisa los comprobantes en la sección Pedidos.`,
    })
  }

  // ── 3. Promociones por vencer ───────────────────────────────────────────
  const expiring = await db.promotion.findMany({
    where: {
      active: true,
      endsAt: { gte: now, lte: Dates.addDays(now, PROMO_EXPIRING_DAYS) },
    },
    select: { name: true, endsAt: true },
  })

  if (expiring.length > 0) {
    const detail = expiring
      .map((p) => `"${p.name}" (${Dates.formatShort(p.endsAt!)})`)
      .join(' · ')
    alerts.push({
      type: 'PROMO_EXPIRING',
      title: `${expiring.length} promoción(es) por vencer`,
      message: `Vencen en los próximos ${PROMO_EXPIRING_DAYS} días: ${detail}. Renuévalas o desactívalas en Promociones.`,
    })
  }

  // ── 4. Libro de Reclamaciones: plazos vencidos o por vencer ─────────────
  // D.S. 101-2022-PCM: respuesta en máximo 15 días hábiles, improrrogable.
  const overdueWhere = { status: 'PENDING' as const, dueAt: { lt: now } }
  const dueSoonWhere = {
    status: 'PENDING' as const,
    dueAt: { gte: now, lte: Dates.addDays(now, COMPLAINT_DUE_SOON_DAYS) },
  }
  const [overdueTotal, dueSoonTotal, urgentComplaints] = await Promise.all([
    db.complaint.count({ where: overdueWhere }),
    db.complaint.count({ where: dueSoonWhere }),
    db.complaint.findMany({
      where: { status: 'PENDING', dueAt: { lte: Dates.addDays(now, COMPLAINT_DUE_SOON_DAYS) } },
      select: { code: true, dueAt: true },
      orderBy: { dueAt: 'asc' },
      take: 5,
    }),
  ])

  if (overdueTotal + dueSoonTotal > 0) {
    const detail = urgentComplaints
      .map((c) => `${c.code} (vence ${Dates.formatShort(c.dueAt)})`)
      .join(' · ')
    alerts.push({
      type: 'COMPLAINT_DUE',
      title:
        overdueTotal > 0
          ? `Libro de Reclamaciones: ${overdueTotal} vencido(s) y ${dueSoonTotal} por vencer`
          : `Libro de Reclamaciones: ${dueSoonTotal} reclamo(s) por vencer`,
      message: `Plazo legal de 15 días hábiles. ${detail}. Respóndelos en Reclamos.`,
    })
  }

  // ── 5. Resumen de ventas (últimas 24 h) ─────────────────────────────────
  const since = Dates.addDays(now, -1)
  const [orderCount, revenue] = await Promise.all([
    db.order.count({
      where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    }),
    db.order.aggregate({
      where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
    }),
  ])

  alerts.push({
    type: 'DAILY_SUMMARY',
    title: `Últimas 24 h: ${orderCount} pedido(s) — ${formatCurrency(Number(revenue._sum.total ?? 0))}`,
    message:
      orderCount > 0
        ? `Se registraron ${orderCount} pedido(s) por un total de ${formatCurrency(Number(revenue._sum.total ?? 0))} en las últimas 24 horas.`
        : 'No se registraron pedidos en las últimas 24 horas.',
  })

  // ── Persistir: reemplaza no-leídas del mismo tipo y purga historial viejo ──
  await db.$transaction(async (tx) => {
    // Limpieza: elimina alertas ya leídas hace más de READ_RETENTION_DAYS
    await tx.adminAlert.deleteMany({
      where: { readAt: { lt: Dates.addDays(now, -READ_RETENTION_DAYS) } },
    })

    for (const alert of alerts) {
      await tx.adminAlert.deleteMany({ where: { type: alert.type, readAt: null } })
      await tx.adminAlert.create({ data: alert })
    }
  })

  return { generated: alerts.length, types: alerts.map((a) => a.type) }
}
