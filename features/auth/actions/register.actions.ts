'use server'

import { registerSchema } from '@/features/auth/schemas/auth.schema'
import { db } from '@/shared/lib/db'
import bcrypt from 'bcryptjs'

// Versión de los Términos y Condiciones aceptada al registrarse.
const TERMS_VERSION = 'v1.0'

export async function registerUser(data: {
  name: string
  email: string
  password: string
  confirm?: string
}): Promise<{ success: true } | { success: false; error: string }> {
  // Validación en SERVIDOR: registerSchema solo corría en el cliente (zodResolver).
  // Una Server Action es un endpoint público — no se puede confiar en el cliente.
  const parsed = registerSchema.safeParse({
    name: data.name,
    email: data.email,
    password: data.password,
    confirm: data.confirm ?? data.password,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  // Normalizar el email: evita registrar el mismo correo con distinta
  // capitalización (findUnique es sensible a mayúsculas).
  const email = parsed.data.email.trim().toLowerCase()
  const name = parsed.data.name.trim()

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'El correo ya está registrado.' }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  // Registro y aceptación de términos en una sola operación atómica: no queda
  // ningún endpoint público que acepte un email suelto para pisar la fila User.
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

  return { success: true }
}
