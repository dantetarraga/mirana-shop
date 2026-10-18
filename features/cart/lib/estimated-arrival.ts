import { Dates } from '@/shared/lib/dates'

/**
 * Llegada estimada de una preventa: "noviembre de 2026". Mes y año, no el día:
 * la fecha es estimada y un día exacto prometería una precisión que la tienda
 * no tiene. Sin fecha cargada → "Fecha por confirmar".
 *
 * Archivo puro: lo usan el carrito (cliente) y la ficha (servidor).
 */
export function formatEstimatedArrival(date: Date | string | null): string {
  // Fecha civil (medianoche UTC): se formatea por componentes UTC, ver Dates.formatCivil.
  return date ? Dates.formatCivil(date, "MMMM 'de' yyyy") : 'Fecha por confirmar'
}
