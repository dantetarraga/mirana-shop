'use server'

import { auth } from '@/auth'
import {
  computeComplaintDueAt,
  formatComplaintCode,
  limaYear,
} from '@/features/complaints/lib/business-days'
import { buildConsumerConstanciaMail, buildResponseMail } from '@/features/complaints/lib/complaint-mail'
import type { ComplaintSheetData } from '@/features/complaints/lib/complaint-sheet'
import { COMPLAINT_SELECT } from '@/features/complaints/queries/complaint.queries'
import {
  createComplaintSchema,
  respondComplaintSchema,
} from '@/features/complaints/schemas/complaint.schema'
import type { ComplaintRow } from '@/features/complaints/types'
import { getProviderLegalData } from '@/features/settings/queries/store-settings.queries'
import { db } from '@/shared/lib/db'
import { sendMail } from '@/shared/lib/mail'
import { requireAdmin } from '@/shared/lib/require-admin'
import { consumeRateLimits, RateLimitError, requestIp } from '@/shared/lib/rate-limit'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Libro de Reclamaciones Virtual (Ley 29571; D.S. 011-2011-PCM, modificado por
// D.S. 006-2014-PCM y D.S. 101-2022-PCM).
//
// RETENCIÓN: las hojas y sus respuestas se conservan ≥ 2 años. Este módulo no
// expone borrado, edición por el consumidor ni papelera; la respuesta del
// proveedor es de solo inserción (ComplaintResponse) y no se puede reescribir.
//
// Nunca se devuelve `err.message` al cliente: el detalle va al log del servidor.
// ---------------------------------------------------------------------------

const MAX_CODE_RETRIES = 5

export type CreateComplaintData = {
  code: string
  createdAt: string
  dueAt: string
  emailSent: boolean
}

/** Error de validación con el mensaje de cada campo, para mostrarlo inline. */
export type CreateComplaintResult =
  | ActionResult<CreateComplaintData>
  | { success: false; error: string; code: 400; fieldErrors: Record<string, string> }

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002'
}

function toSheetData(c: ComplaintRow): ComplaintSheetData {
  return { ...c, claimedAmount: c.claimedAmount != null ? Number(c.claimedAmount) : null }
}

// ---------------------------------------------------------------------------
// createComplaint — pública, sin sesión. El correlativo es numérico por año
// (America/Lima): MAX(seq)+1 dentro de la transacción, con reintento si dos
// envíos simultáneos chocan con @@unique([year, seq]).
// ---------------------------------------------------------------------------

export async function createComplaint(rawInput: unknown): Promise<CreateComplaintResult> {
  // Honeypot: un campo invisible para personas. Si llega con contenido se
  // descarta en silencio (respuesta genérica, sin registrar nada).
  const honeypot =
    typeof rawInput === 'object' && rawInput !== null
      ? (rawInput as { extraInfo?: unknown }).extraInfo
      : undefined
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    console.warn('[createComplaint] honeypot activado; envío descartado')
    const now = new Date()
    return {
      success: true,
      data: {
        code: formatComplaintCode(limaYear(now), 0),
        createdAt: now.toISOString(),
        dueAt: computeComplaintDueAt(now).toISOString(),
        emailSent: false,
      },
    }
  }

  const parsed = createComplaintSchema.safeParse(rawInput)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return {
      success: false,
      error: 'Revisa los campos marcados.',
      code: 400,
      fieldErrors,
    }
  }

  const d = parsed.data

  try {
    await consumeRateLimits([
      // Por IP holgado: oficinas, colegios y redes móviles comparten IP (CGNAT).
      { scope: 'complaint-ip', subject: await requestIp(), limit: 20, windowMs: 60 * 60_000 },
      { scope: 'complaint-email', subject: d.email, limit: 3, windowMs: 60 * 60_000 },
    ])
  } catch (err) {
    if (err instanceof RateLimitError) return { success: false, error: err.message, code: 429 }
    console.error('[createComplaint] rate limit', err)
    return { success: false, error: 'No se pudo registrar el reclamo. Inténtalo de nuevo.', code: 500 }
  }

  const create = () =>
    db.$transaction(async (tx) => {
      const createdAt = new Date()
      const year = limaYear(createdAt)
      const last = await tx.complaint.aggregate({ where: { year }, _max: { seq: true } })
      const seq = (last._max.seq ?? 0) + 1

      return tx.complaint.create({
        data: {
          code: formatComplaintCode(year, seq),
          year,
          seq,
          fullName: d.fullName,
          docType: d.docType,
          docNumber: d.docNumber.toUpperCase(),
          address: d.address,
          phone: d.phone,
          email: d.email,
          isMinor: d.isMinor,
          guardianName: d.isMinor ? d.guardianName : null,
          guardianDocType: d.isMinor ? d.guardianDocType : null,
          guardianDocNumber: d.isMinor ? d.guardianDocNumber?.toUpperCase() : null,
          goodType: d.goodType,
          orderCode: d.orderCode ? d.orderCode.toUpperCase() : null,
          productDescription: d.productDescription,
          claimedAmount: d.claimedAmount ? Number(d.claimedAmount) : undefined,
          type: d.type,
          detail: d.detail,
          request: d.request,
          truthDeclarationAccepted: d.truthDeclarationAccepted,
          privacyAccepted: d.privacyAccepted,
          dueAt: computeComplaintDueAt(createdAt),
          createdAt,
        },
        select: COMPLAINT_SELECT,
      }) as Promise<ComplaintRow>
    })

  let complaint: ComplaintRow | null = null
  try {
    for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
      try {
        complaint = await create()
        break
      } catch (err) {
        if (!isUniqueViolation(err) || attempt === MAX_CODE_RETRIES) throw err
      }
    }
    if (!complaint) throw new Error('No se pudo generar el correlativo del reclamo')
  } catch (err) {
    console.error('[createComplaint]', err)
    return {
      success: false,
      error: 'No pudimos registrar tu reclamo. Inténtalo de nuevo en unos minutos.',
      code: 500,
    }
  }

  // Constancia por correo: la hoja ya quedó registrada, así que un fallo de
  // envío no la deshace; queda consumerEmailSentAt = null y el admin puede
  // reenviarla desde el detalle.
  const emailSent = await sendConstancia(complaint)

  revalidatePath('/admin/complaints')

  return {
    success: true,
    data: {
      code: complaint.code,
      createdAt: complaint.createdAt.toISOString(),
      dueAt: complaint.dueAt.toISOString(),
      emailSent,
    },
  }
}

async function sendConstancia(complaint: ComplaintRow): Promise<boolean> {
  try {
    const provider = await getProviderLegalData()
    const result = await sendMail(buildConsumerConstanciaMail(toSheetData(complaint), provider))
    if (!result.sent) return false
    await db.complaint.update({
      where: { id: complaint.id },
      data: { consumerEmailSentAt: new Date() },
      select: { id: true },
    })
    return true
  } catch (err) {
    console.error('[createComplaint] constancia', err)
    return false
  }
}

async function sendResponse(complaint: ComplaintRow): Promise<boolean> {
  if (!complaint.response || !complaint.respondedAt) return false
  try {
    const provider = await getProviderLegalData()
    const result = await sendMail(
      buildResponseMail(toSheetData(complaint), provider, {
        body: complaint.response,
        providerActions: complaint.providerActions,
        respondedAt: complaint.respondedAt,
      }),
    )
    if (!result.sent) return false
    await db.complaint.update({
      where: { id: complaint.id },
      data: { responseEmailSentAt: new Date() },
      select: { id: true },
    })
    return true
  } catch (err) {
    console.error('[respondComplaint] correo de respuesta', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// respondComplaint — admin. La respuesta es inmutable: solo se registra si la
// hoja sigue PENDING (update condicional) y se inserta una única
// ComplaintResponse (complaintId único). No existe "actualizar respuesta".
// ---------------------------------------------------------------------------

export type RespondComplaintData = { complaint: ComplaintRow; emailSent: boolean }

export async function respondComplaint(
  rawInput: unknown,
): Promise<ActionResult<RespondComplaintData>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = respondComplaintSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const { complaintId, response } = parsed.data
  const providerActions = parsed.data.providerActions || null
  const session = await auth()
  const respondedBy = session?.user?.email ?? null

  let updated: ComplaintRow
  try {
    const result = await db.$transaction(async (tx) => {
      const respondedAt = new Date()
      const { count } = await tx.complaint.updateMany({
        where: { id: complaintId, status: 'PENDING' },
        data: { status: 'ANSWERED', response, providerActions, respondedAt },
      })
      if (count === 0) {
        const exists = await tx.complaint.findUnique({
          where: { id: complaintId },
          select: { id: true },
        })
        return exists ? ('answered' as const) : ('missing' as const)
      }
      await tx.complaintResponse.create({
        data: { complaintId, body: response, providerActions, respondedBy, createdAt: respondedAt },
        select: { id: true },
      })
      return (await tx.complaint.findUniqueOrThrow({
        where: { id: complaintId },
        select: COMPLAINT_SELECT,
      })) as ComplaintRow
    })

    if (result === 'missing') return { success: false, error: 'Reclamo no encontrado', code: 404 }
    if (result === 'answered') {
      return {
        success: false,
        error: 'Este reclamo ya fue respondido. La respuesta registrada no se puede modificar.',
        code: 409,
      }
    }
    updated = result
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        success: false,
        error: 'Este reclamo ya fue respondido. La respuesta registrada no se puede modificar.',
        code: 409,
      }
    }
    console.error('[respondComplaint]', err)
    return { success: false, error: 'No se pudo registrar la respuesta', code: 500 }
  }

  const emailSent = await sendResponse(updated)
  if (emailSent) updated = { ...updated, responseEmailSentAt: new Date() }

  revalidatePath('/admin/complaints')

  return { success: true, data: { complaint: updated, emailSent } }
}

// ---------------------------------------------------------------------------
// resendComplaintEmail — admin. Reintenta la constancia o la respuesta cuando
// el envío original falló (SMTP caído o sin configurar). No modifica la hoja.
// ---------------------------------------------------------------------------

const resendSchema = z.object({
  complaintId: z.string().min(1),
  kind: z.enum(['constancia', 'respuesta']),
})

export async function resendComplaintEmail(
  rawInput: unknown,
): Promise<ActionResult<RespondComplaintData>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = resendSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: 'Datos inválidos', code: 400 }
  const { complaintId, kind } = parsed.data

  try {
    const complaint = (await db.complaint.findUnique({
      where: { id: complaintId },
      select: COMPLAINT_SELECT,
    })) as ComplaintRow | null
    if (!complaint) return { success: false, error: 'Reclamo no encontrado', code: 404 }
    if (kind === 'respuesta' && complaint.status !== 'ANSWERED') {
      return { success: false, error: 'El reclamo aún no tiene respuesta', code: 422 }
    }

    const emailSent =
      kind === 'constancia' ? await sendConstancia(complaint) : await sendResponse(complaint)
    const now = new Date()
    const refreshed: ComplaintRow = emailSent
      ? kind === 'constancia'
        ? { ...complaint, consumerEmailSentAt: now }
        : { ...complaint, responseEmailSentAt: now }
      : complaint

    revalidatePath('/admin/complaints')
    return { success: true, data: { complaint: refreshed, emailSent } }
  } catch (err) {
    console.error('[resendComplaintEmail]', err)
    return { success: false, error: 'No se pudo reenviar el correo', code: 500 }
  }
}
