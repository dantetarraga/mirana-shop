import { z } from "zod"

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email:    z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

export const registerSchema = z.object({
  name:     z.string().min(2, "Nombre requerido"),
  email:    z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Las contraseñas no coinciden",
  path:    ["confirm"],
})

export type LoginInput    = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export const productSchema = z.object({
  name:  z.string().min(1, "Nombre requerido"),
  sku:   z.string().min(1, "SKU requerido"),
  cat:   z.enum(["figures", "lego", "vehicles"], { error: "Categoría inválida" }),
  price: z.number({ error: "Precio requerido" }).positive("Debe ser mayor a 0"),
  stock: z.number({ error: "Cantidad requerida" }).int().min(0, "No puede ser negativo"),
  brand: z.string().optional().default(""),
  badge: z.string().optional().default(""),
  desc:  z.string().optional().default(""),
})

export type ProductInput = z.infer<typeof productSchema>

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export const bannerSchema = z.object({
  title:    z.string().min(1, "Título requerido"),
  subtitle: z.string().optional().default(""),
  cta:      z.string().optional().default(""),
  position: z.string().min(1, "Posición requerida"),
})

export type BannerInput = z.infer<typeof bannerSchema>
