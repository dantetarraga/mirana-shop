/**
 * Estilo único de campo de formulario — input, textarea y select.
 *
 * Antes vivía por duplicado: `cls.input` (Tailwind, en admin-classes.ts) y
 * `.adm-input` (regla global en globals.css). Diferían en 1-2 px de padding y
 * solo la global traía color de placeholder, transición y borde al foco, así que
 * un mismo drawer mezclaba campos que se comportaban distinto al enfocarlos.
 * Ahora `cls.input` reexporta esta constante y `.adm-input` ya no existe.
 *
 * Vive fuera de `shared/lib/admin/` porque también lo usan pantallas de tienda
 * (AuthModal, el Select del catálogo).
 *
 * El checkout mantiene su propia variante a propósito
 * (`features/checkout/components/ui.tsx`): va sobre `--surf`, no sobre `--card`.
 */
export const inputCls =
  'w-full bg-card border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[11px] outline-none placeholder:text-muted/50 transition-colors duration-200 focus:border-(--bdh)'
