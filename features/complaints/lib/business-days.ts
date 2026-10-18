// ---------------------------------------------------------------------------
// Plazos del Libro de Reclamaciones — lógica pura (sin DB), testeada en
// business-days.test.ts.
//
// D.S. 101-2022-PCM: el proveedor responde en un plazo no mayor a 15 días
// hábiles, improrrogable. Se cuentan de lunes a viernes excluyendo los
// feriados nacionales del Perú, desde el día hábil siguiente al registro.
// El vencimiento es el fin de ese día en Lima.
//
// Perú no usa horario de verano desde 1994: America/Lima es UTC-5 fijo.
// ---------------------------------------------------------------------------

export const COMPLAINT_RESPONSE_BUSINESS_DAYS = 15
/** Umbral del semáforo "por vencer" (días calendario restantes) */
export const COMPLAINT_DUE_SOON_DAYS = 3

const LIMA_TZ = 'America/Lima'
const LIMA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** Fecha civil (sin hora). month: 1–12 */
export type CivilDate = { year: number; month: number; day: number }

const limaFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIMA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Día civil en Lima del instante dado. */
export function limaCivilDate(instant: Date): CivilDate {
  const parts = limaFormatter.formatToParts(instant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

/** Año en Lima: es el que corresponde al correlativo LR-YYYY-… */
export function limaYear(instant: Date): number {
  return limaCivilDate(instant).year
}

/** Domingo de Pascua (algoritmo anónimo gregoriano / Meeus). */
export function easterSunday(year: number): CivilDate {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { year, month, day }
}

/** Feriados nacionales fijos (mes-día). */
const FIXED_HOLIDAYS = new Set([
  '01-01', // Año Nuevo
  '05-01', // Día del Trabajo
  '06-07', // Batalla de Arica y Día de la Bandera
  '06-29', // San Pedro y San Pablo
  '07-23', // Día de la Fuerza Aérea del Perú
  '07-28', // Fiestas Patrias
  '07-29', // Fiestas Patrias
  '08-06', // Batalla de Junín
  '08-30', // Santa Rosa de Lima
  '10-08', // Combate de Angamos
  '11-01', // Día de Todos los Santos
  '12-08', // Inmaculada Concepción
  '12-09', // Batalla de Ayacucho
  '12-25', // Navidad
])

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Fecha civil como número de días desde epoch (aritmética sin zonas). */
function toDayNumber(d: CivilDate): number {
  return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / DAY_MS)
}

function fromDayNumber(n: number): CivilDate {
  const date = new Date(n * DAY_MS)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

export function addCivilDays(d: CivilDate, days: number): CivilDate {
  return fromDayNumber(toDayNumber(d) + days)
}

export function isPeruNationalHoliday(d: CivilDate): boolean {
  if (FIXED_HOLIDAYS.has(`${pad2(d.month)}-${pad2(d.day)}`)) return true
  // Jueves y Viernes Santo (móviles, según la Pascua)
  const easter = toDayNumber(easterSunday(d.year))
  const n = toDayNumber(d)
  return n === easter - 3 || n === easter - 2
}

export function isBusinessDay(d: CivilDate): boolean {
  const weekday = new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() // 0 = domingo
  if (weekday === 0 || weekday === 6) return false
  return !isPeruNationalHoliday(d)
}

/** N-ésimo día hábil posterior a `from` (sin contar `from`). */
export function addBusinessDays(from: CivilDate, businessDays: number): CivilDate {
  let current = from
  let counted = 0
  while (counted < businessDays) {
    current = addCivilDays(current, 1)
    if (isBusinessDay(current)) counted++
  }
  return current
}

/** Instante UTC del fin del día civil en Lima (23:59:59.999). */
export function endOfLimaDay(d: CivilDate): Date {
  return new Date(Date.UTC(d.year, d.month - 1, d.day + 1) + LIMA_UTC_OFFSET_MS - 1)
}

/** Vencimiento legal de la respuesta para una hoja registrada en `createdAt`. */
export function computeComplaintDueAt(
  createdAt: Date,
  businessDays: number = COMPLAINT_RESPONSE_BUSINESS_DAYS,
): Date {
  return endOfLimaDay(addBusinessDays(limaCivilDate(createdAt), businessDays))
}

export type ComplaintDueStatus = 'answered' | 'overdue' | 'due-soon' | 'on-time'

/** Semáforo del admin: vencido / por vencer (≤ 3 días) / en plazo. */
export function complaintDueStatus(
  dueAt: Date,
  answered: boolean,
  now: Date = new Date(),
  soonDays: number = COMPLAINT_DUE_SOON_DAYS,
): ComplaintDueStatus {
  if (answered) return 'answered'
  const remaining = dueAt.getTime() - now.getTime()
  if (remaining < 0) return 'overdue'
  if (remaining <= soonDays * DAY_MS) return 'due-soon'
  return 'on-time'
}

// ---------------------------------------------------------------------------
// Correlativo: el orden lo dan year + seq numéricos; el código es solo display.
// ---------------------------------------------------------------------------

export const COMPLAINT_SEQ_DIGITS = 6

export function formatComplaintCode(year: number, seq: number): string {
  return `LR-${year}-${String(seq).padStart(COMPLAINT_SEQ_DIGITS, '0')}`
}
