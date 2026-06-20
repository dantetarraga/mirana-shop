import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria').min(6, 'Mínimo 6 caracteres'),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio').min(2, 'Mínimo 2 caracteres'),
    email: z.string().min(1, 'El correo es obligatorio').email('Correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria').min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
