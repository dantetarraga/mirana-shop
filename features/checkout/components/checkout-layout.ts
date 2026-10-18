// ---------------------------------------------------------------------------
// Medidas del checkout compartidas entre la vista real (CheckoutView) y su
// esqueleto (CheckoutSkeleton / app/(storefront)/checkout/loading.tsx).
//
// Sin 'use client' a propósito: loading.tsx es un Server Component y las
// exportaciones de un módulo cliente le llegarían como referencias, no como
// strings. Cambiar una medida aquí la cambia en ambos lados y evita el salto
// de layout al terminar de cargar.
// ---------------------------------------------------------------------------

/** Contenedor de la página */
export const CHECKOUT_PAGE = 'max-w-275 mx-auto px-4 sm:px-6 pt-8 pb-16'

/** Título de la página (display) */
export const CHECKOUT_TITLE =
  'font-display font-black uppercase text-[30px] sm:text-[36px] leading-none tracking-tight mb-6 lg:mb-8'

/**
 * Rejilla: en móvil una columna ordenada con `order-*` (pasos → resumen
 * plegable → paso actual → términos/volver → cómo funciona); desde `lg`,
 * formulario a la izquierda y columna fija de 400px a la derecha.
 */
export const CHECKOUT_GRID =
  'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] gap-x-10 gap-y-5 items-start'

export const CHECKOUT_STEPS_CELL = 'order-1 lg:col-start-1 lg:row-start-1 min-w-0'
export const CHECKOUT_CONTENT_CELL = 'order-3 lg:col-start-1 lg:row-start-2 min-w-0 flex flex-col gap-5'

/**
 * Columna del resumen. En móvil es `display: contents` para que sus piezas
 * (resumen, CTA, aviso) se repartan en la rejilla con `order-*`; desde `lg`
 * es una columna fija bajo el navbar (--nh).
 */
export const CHECKOUT_ASIDE =
  'max-lg:contents lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-[calc(var(--nh)+24px)] lg:flex lg:flex-col'

export const CHECKOUT_SUMMARY_CELL = 'order-2 lg:border-b-0'

/** Pie del resumen: términos, CTA (solo desktop) y volver. Pegado a la tarjeta en lg. */
export const CHECKOUT_PANEL =
  'order-4 flex flex-col gap-3 lg:bg-card lg:border lg:border-t-0 lg:border-(--bd) lg:px-6 lg:pb-5'

export const CHECKOUT_ASSURANCE_CELL = 'order-5 lg:mt-4'

/** Barra fija inferior en móvil (total + CTA). `data-sticky-cta` sube el FAB. */
export const CHECKOUT_STICKY_BAR =
  'sticky-cta lg:hidden fixed inset-x-0 bottom-0 z-150 bg-surf/95 backdrop-blur-md border-t border-(--bd) px-4 pt-3 flex items-center gap-3'

/** Enlace secundario (volver) — texto, no compite con el CTA */
export const CHECKOUT_BACK_LINK =
  'self-center inline-flex items-center justify-center gap-1.5 min-h-11 px-2 text-[14px] font-semibold text-muted hover:text-text underline-offset-4 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

// ── Campos y secciones ────────────────────────────────────────────────────

/**
 * Estilo de campo de la tienda. Alto fijo h-12 (el esqueleto usa la misma
 * medida). `text-base` (16px) en móvil: con menos, Safari iOS hace zoom al
 * enfocar el input y descoloca todo el formulario.
 *
 * El valor va en `text-text` con peso medio y el placeholder (cuando lo hay) en
 * `text-placeholder`, más tenue: un campo vacío no se confunde con uno lleno.
 */
export const input =
  'w-full h-12 bg-surf border border-field text-text font-sans font-medium text-base sm:text-[15px] px-3.5 outline-none placeholder:text-placeholder placeholder:font-normal focus:border-accent-ink aria-[invalid=true]:border-danger transition-colors duration-150 disabled:opacity-60'

/** Rótulo de campo: sentence case, legible, sin mayúsculas espaciadas. */
export const fieldLabel = 'block text-[13px] leading-5 font-semibold text-text mb-1.5'
export const fieldHint = 'text-muted text-[12px] leading-4 mt-1.5'

/** Título de sección (tarjeta de cada paso) */
export const sectionTitle = 'font-display font-black uppercase text-[22px] leading-none tracking-tight'
/** Bajada bajo el título de sección */
export const sectionLead = 'text-[14px] leading-5 text-muted mt-2'
/** Tarjeta de cada paso */
export const sectionCard = 'bg-card border border-(--bd) p-5 sm:p-6'
/** Rejilla de campos del formulario */
export const fieldGrid = 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 mt-6'

/** Hints de los campos de "Tus datos" (DeliveryForm); el esqueleto los mide igual */
export const DELIVERY_FIELD_HINTS = {
  dni: '8 dígitos.',
  phone: 'Para coordinar por WhatsApp.',
  reference: 'Opcional. Ej.: frente al parque, puerta roja.',
} as const

/** "2 productos" */
export function itemCountLabel(n: number) {
  return `${n} ${n === 1 ? 'producto' : 'productos'}`
}

/** 60 → "1 hora", 90 → "90 minutos" */
export function formatReservation(minutes: number) {
  if (minutes % 60 === 0) {
    const h = minutes / 60
    return h === 1 ? '1 hora' : `${h} horas`
  }
  return `${minutes} minutos`
}
