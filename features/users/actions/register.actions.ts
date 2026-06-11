'use server'

import { db } from '@/shared/lib/db'
import bcrypt from 'bcryptjs'

export async function registerUser(data: {
  name: string
  email: string
  password: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const existing = await db.user.findUnique({ where: { email: data.email } })
  if (existing) {
    return { success: false, error: 'El correo ya está registrado.' }
  }

  const passwordHash = await bcrypt.hash(data.password, 12)

  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  return { success: true }
}
