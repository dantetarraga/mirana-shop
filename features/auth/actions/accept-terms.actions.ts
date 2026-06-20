'use server'

import { db } from '@/shared/lib/db'

const TERMS_VERSION = 'v1.0'

/**
 * Registra la aceptación de Términos y Condiciones para un usuario.
 * Se llama en el momento del registro.
 */
export async function acceptTerms(email: string): Promise<void> {
  await db.user.upsert({
    where: { email },
    update: {
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
    create: {
      email,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
  })
}
