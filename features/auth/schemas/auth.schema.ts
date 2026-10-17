import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'El correo es obligatorio').email('Correo inválido').max(254),
  password: z.string().min(1, 'La contraseña es obligatoria').min(6, 'Mínimo 6 caracteres').max(200),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').min(2, 'Mínimo 2 caracteres').max(120),
    email: z.string().trim().toLowerCase().min(1, 'El correo es obligatorio').email('Correo inválido').max(254),
    password: z
      .string()
      .min(1, 'La contraseña es obligatoria')
      .min(8, 'Mínimo 8 caracteres')
      .refine((value) => new TextEncoder().encode(value).length <= 72, 'Máximo 72 bytes'),
    confirm: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
