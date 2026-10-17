import { Dates } from '@/shared/lib/dates'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/** @deprecated Importa desde '@/shared/lib/slug' — se re-exporta por compatibilidad. */
export { slugify } from '@/shared/lib/slug'

/** @deprecated Usa Dates.format de '@/shared/lib/dates' — se mantiene por compatibilidad */
export function formatDate(date: Date | string, fmt = "d 'de' MMMM 'de' yyyy"): string {
  return Dates.format(date, fmt)
}
