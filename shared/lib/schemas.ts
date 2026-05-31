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
// Productos (legacy mock — para compatibilidad con forms existentes)
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
// Productos — schema para BD real (Server Actions)
// ---------------------------------------------------------------------------

export const productDbSchema = z.object({
  name:           z.string().min(1, "Nombre requerido"),
  slug:           z.string().min(1, "Slug requerido").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  sku:            z.string().min(1, "SKU requerido"),
  description:    z.string().optional().default(""),
  price:          z.number({ error: "Precio requerido" }).positive("Debe ser mayor a 0"),
  compareAtPrice: z.number().positive().optional(),
  stock:          z.number({ error: "Cantidad requerida" }).int().min(0, "No puede ser negativo"),
  categoryId:     z.string().min(1, "Categoría requerida"),
  brandId:        z.string().min(1, "Marca requerida"),
  status:         z.enum(["AVAILABLE", "PREORDER", "SOLD_OUT", "COMING_SOON", "ARCHIVED"]).default("AVAILABLE"),
  featured:       z.boolean().default(false),
  imageUrl:       z.string().url("URL de imagen inválida").optional(),
})

export type ProductDbInput = z.infer<typeof productDbSchema>

// ---------------------------------------------------------------------------
// Importación masiva de productos
// ---------------------------------------------------------------------------

export const importProductRowSchema = z.object({
  name:        z.string().min(1),
  sku:         z.string().min(1),
  cat:         z.enum(["figures", "lego", "vehicles"]),
  price:       z.number().positive(),
  stock:       z.number().int().min(0),
  brand:       z.string().optional().default(""),
  desc:        z.string().optional().default(""),
})

export type ImportProductRow = z.infer<typeof importProductRowSchema>

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

// ---------------------------------------------------------------------------
// Banners — schema para BD real (Server Actions)
// ---------------------------------------------------------------------------

export const bannerDbSchema = z.object({
  title:    z.string().min(1, "Título requerido"),
  subtitle: z.string().optional().default(""),
  ctaLabel: z.string().optional().default(""),
  ctaHref:  z.union([
    z.string().url("URL inválida"),   // URL absoluta: https://...
    z.string().startsWith("/"),        // Ruta interna: /catalogo, /productos/...
    z.literal(""),
  ]).optional(),
  imageUrl: z.string().url("URL de imagen requerida"),
  position: z.number().int().min(0).default(0),
  active:   z.boolean().default(false),
})

export type BannerDbInput = z.infer<typeof bannerDbSchema>

// ---------------------------------------------------------------------------
// Ajuste de inventario
// ---------------------------------------------------------------------------

export const adjustStockSchema = z.object({
  productId: z.string().min(1),
  newStock:  z.number().int().min(0, "No puede ser negativo"),
  reason:    z.string().optional(),
})

export type AdjustStockInput = z.infer<typeof adjustStockSchema>

// ---------------------------------------------------------------------------
// Cambio de estado de orden
// ---------------------------------------------------------------------------

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status:  z.enum(["PENDING", "AWAITING_PROOF", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
