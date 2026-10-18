'use server'

import { registerSchema } from '@/features/auth/schemas/auth.schema'
import { db } from '@/shared/lib/db'
import { consumeRateLimits, RateLimitError, requestIp } from '@/shared/lib/rate-limit'
import bcrypt from 'bcryptjs'

// Versión de los Términos y Condiciones aceptada al registrarse.
const TERMS_VERSION = 'v1.0'

const DUPLICATE_OR_INVALID =
  'No pudimos crear la cuenta con esos datos. Si ya tienes una, inicia sesión o entra con Google.'

export async function registerUser(data: unknown): Promise<{ success: true } | { success: false; error: string }> {
  // Validación en SERVIDOR: registerSchema solo corría en el cliente (zodResolver).
  // Una Server Action es un endpoint público — no se puede confiar en el cliente.
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  // Normalizar el email: evita registrar el mismo correo con distinta
  // capitalización (findUnique es sensible a mayúsculas).
  const email = parsed.data.email.trim().toLowerCase()
  const name = parsed.data.name.trim()

  try {
    await consumeRateLimits([
      { scope: 'register-ip', subject: await requestIp(), limit: 5, windowMs: 60 * 60_000 },
      { scope: 'register-email', subject: email, limit: 3, windowMs: 60 * 60_000 },
    ])
  } catch (err) {
    return {
      success: false,
      error: err instanceof RateLimitError ? err.message : 'El registro no está disponible temporalmente.',
    }
  }

  // Mensaje genérico: no confirmar que el correo ya tiene cuenta (enumeración).
  // El rate limit de arriba acota además cuántos correos se pueden probar.
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return { success: false, error: DUPLICATE_OR_INVALID }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  // Registro y aceptación de términos en una sola operación atómica: no queda
  // ningún endpoint público que acepte un email suelto para pisar la fila User.
  // emailVerified queda en null a propósito: la cuenta no prueba la propiedad
  // del correo. Si luego entra Google con ese email, jwt() en auth.ts descarta
  // esta contraseña (protección contra pre-apropiación de cuentas).
  try {
    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CUSTOMER',
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
      },
    })
  } catch {
    // Carrera con otro registro del mismo correo (unique): misma respuesta
    // genérica que arriba, sin filtrar el detalle de la BD.
    return { success: false, error: DUPLICATE_OR_INVALID }
  }

  return { success: true }
}
