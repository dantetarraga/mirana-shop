import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Dates — punto único de acceso a fechas en toda la app.
//
// Toda lógica de fechas (formateo, comparaciones, "hace N días", etc.) debe
// pasar por esta clase. Si mañana cambiamos date-fns por otra librería (o
// necesitamos fijar una zona horaria), solo se modifica este archivo.
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000

export class Dates {
  /** Fecha actual */
  static now(): Date {
    return new Date()
  }

  /** Timestamp actual en milisegundos */
  static timestamp(): number {
    return Date.now()
  }

  /** Formatea en español (Perú). Por defecto: "4 de julio de 2026" */
  static format(date: Date | string, fmt = "d 'de' MMMM 'de' yyyy"): string {
    return format(new Date(date), fmt, { locale: es })
  }

  /** Formato corto: "04/07/2026" */
  static formatShort(date: Date | string): string {
    return Dates.format(date, 'dd/MM/yyyy')
  }

  /** Formato con hora: "04/07/2026 14:30" */
  static formatWithTime(date: Date | string): string {
    return Dates.format(date, 'dd/MM/yyyy HH:mm')
  }

  /** ¿La fecha está dentro de los últimos `days` días? */
  static isWithinLastDays(date: Date | string, days: number): boolean {
    return Dates.timestamp() - new Date(date).getTime() < days * MS_PER_DAY
  }

  /** Días transcurridos (enteros, hacia abajo) desde la fecha dada */
  static daysSince(date: Date | string): number {
    return Math.floor((Dates.timestamp() - new Date(date).getTime()) / MS_PER_DAY)
  }

  /** Suma días (acepta negativos) */
  static addDays(date: Date | string, days: number): Date {
    return new Date(new Date(date).getTime() + days * MS_PER_DAY)
  }

  /** ¿a es anterior a b? */
  static isBefore(a: Date | string, b: Date | string): boolean {
    return new Date(a).getTime() < new Date(b).getTime()
  }
}
