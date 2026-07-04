'use server'

import { COMPLAINT_SELECT } from '@/features/complaints/queries/complaint.queries'
import {
  createComplaintSchema,
  respondComplaintSchema,
} from '@/features/complaints/schemas/complaint.schema'
import type { ComplaintRow } from '@/features/complaints/types'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// createComplaint — pública, sin sesión. El código LR-YYYY-NNNN se calcula
// con count(): dos envíos simultáneos pueden chocar en el unique de `code`,
// se reintenta hasta 3 veces (mismo patrón que placeOrder).
// ---------------------------------------------------------------------------

const MAX_CODE_RETRIES = 3

export async function createComplaint(
  rawInput: unknown,
): Promise<ActionResult<{ code: string }>> {
  const parsed = createComplaintSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const d = parsed.data

  const create = () =>
    db.$transaction(async (tx) => {
      const year = new Date().getFullYear()
      const count = await tx.complaint.count()
      const code = `LR-${year}-${String(count + 1).padStart(4, '0')}`

      return tx.complaint.create({
        data: {
          code,
          fullName: d.fullName,
          docType: d.docType,
          docNumber: d.docNumber,
          address: d.address,
          phone: d.phone,
          email: d.email,
          productDescription: d.productDescription,
          claimedAmount: d.claimedAmount ? Number(d.claimedAmount) : undefined,
          type: d.type,
          detail: d.detail,
          request: d.request,
        },
        select: { code: true },
      })
    })

  try {
    let complaint: { code: string } | null = null
    for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
      try {
        complaint = await create()
        break
      } catch (err) {
        const isCodeCollision =
          typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002'
        if (!isCodeCollision || attempt === MAX_CODE_RETRIES) throw err
      }
    }
    if (!complaint) throw new Error('No se pudo generar el código del reclamo')

    revalidatePath('/admin/complaints')

    return { success: true, data: { code: complaint.code } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar tu reclamo',
      code: 500,
    }
  }
}

// ---------------------------------------------------------------------------
// respondComplaint — admin
// ---------------------------------------------------------------------------

export async function respondComplaint(rawInput: unknown): Promise<ActionResult<ComplaintRow>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = respondComplaintSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const { complaintId, response } = parsed.data

  try {
    const updated = (await db.complaint.update({
      where: { id: complaintId },
      data: { response, status: 'ANSWERED', respondedAt: new Date() },
      select: COMPLAINT_SELECT,
    })) as ComplaintRow

    revalidatePath('/admin/complaints')

    return { success: true, data: updated }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al enviar la respuesta',
      code: 500,
    }
  }
}
