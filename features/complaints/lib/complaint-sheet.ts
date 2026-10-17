// ---------------------------------------------------------------------------
// Contenido de la Hoja de Reclamación (Anexo I del D.S. 011-2011-PCM),
// compartido por la hoja imprimible del formulario, la constancia por correo
// y la respuesta. Lógica pura: sirve en cliente y servidor.
// ---------------------------------------------------------------------------

export const STORE_DISPLAY_NAME = 'Mirana Shop'

/** Definiciones literales del Anexo I. */
export const COMPLAINT_TYPE_DEFINITIONS = {
  RECLAMO: 'Disconformidad relacionada a los productos o servicios.',
  QUEJA:
    'Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.',
} as const

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
}

export const GOOD_TYPE_LABELS: Record<string, string> = {
  PRODUCTO: 'Producto',
  SERVICIO: 'Servicio',
}

const DOC_LABELS: Record<string, string> = {
  DNI: 'DNI',
  CE: 'Carné de extranjería',
  PASAPORTE: 'Pasaporte',
}

/** Leyenda del aviso del Libro de Reclamaciones (Anexo II). */
export const ANEXO_II_NOTICE =
  'Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones a tu disposición. Solicítalo para registrar la queja o reclamo que tengas.'

/** Notas al pie de la hoja (Anexo I). */
export const SHEET_FOOTNOTES = [
  'La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.',
  'El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.',
] as const

export type ProviderInfo = {
  legalName: string | null
  ruc: string | null
  fiscalAddress: string | null
}

export type ComplaintSheetData = {
  code: string
  createdAt: Date | string
  dueAt: Date | string
  fullName: string
  docType: string
  docNumber: string
  address: string
  phone: string
  email: string
  isMinor: boolean
  guardianName?: string | null
  guardianDocType?: string | null
  guardianDocNumber?: string | null
  goodType: string
  orderCode?: string | null
  productDescription: string
  claimedAmount?: number | string | null
  type: string
  detail: string
  request: string
}

export type SheetRow = { label: string; value: string; multiline?: boolean }
export type SheetSection = { title: string; rows: SheetRow[] }

const limaDateTime = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const limaDate = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** "17/10/2026 14:30" en hora de Lima, independiente de la zona del servidor. */
export function formatLimaDateTime(date: Date | string): string {
  return limaDateTime.format(new Date(date))
}

/** "17/10/2026" en hora de Lima. */
export function formatLimaDate(date: Date | string): string {
  return limaDate.format(new Date(date))
}

export function providerRows(provider: ProviderInfo): SheetRow[] {
  const pending = '(pendiente de configurar)'
  return [
    { label: 'Razón social', value: provider.legalName || pending },
    { label: 'RUC', value: provider.ruc || pending },
    { label: 'Domicilio fiscal', value: provider.fiscalAddress || pending },
  ]
}

/** Línea compacta "Razón social · RUC 20… · Domicilio" (vacía si no hay datos). */
export function providerLine(provider: ProviderInfo): string {
  return [
    provider.legalName,
    provider.ruc ? `RUC ${provider.ruc}` : null,
    provider.fiscalAddress,
  ]
    .filter(Boolean)
    .join(' · ')
}

function formatAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'No indicado'
  const n = Number(amount)
  return Number.isFinite(n) ? `S/ ${n.toFixed(2)}` : 'No indicado'
}

export function complaintSheetSections(c: ComplaintSheetData): SheetSection[] {
  const consumer: SheetRow[] = [
    { label: 'Nombre completo', value: c.fullName },
    { label: 'Documento', value: `${DOC_LABELS[c.docType] ?? c.docType} ${c.docNumber}` },
    { label: 'Domicilio', value: c.address },
    { label: 'Teléfono', value: c.phone },
    { label: 'Correo electrónico', value: c.email },
    { label: 'Menor de edad', value: c.isMinor ? 'Sí' : 'No' },
  ]
  if (c.isMinor) {
    consumer.push(
      { label: 'Padre, madre o apoderado', value: c.guardianName ?? '' },
      {
        label: 'Documento del apoderado',
        value: `${DOC_LABELS[c.guardianDocType ?? ''] ?? c.guardianDocType ?? ''} ${c.guardianDocNumber ?? ''}`.trim(),
      },
    )
  }

  return [
    {
      title: '1. Identificación del consumidor reclamante',
      rows: consumer,
    },
    {
      title: '2. Identificación del bien contratado',
      rows: [
        { label: 'Tipo', value: GOOD_TYPE_LABELS[c.goodType] ?? c.goodType },
        { label: 'Nº de pedido', value: c.orderCode || 'No indicado' },
        { label: 'Descripción', value: c.productDescription, multiline: true },
        { label: 'Monto reclamado', value: formatAmount(c.claimedAmount) },
      ],
    },
    {
      title: '3. Detalle de la reclamación y pedido del consumidor',
      rows: [
        {
          label: 'Tipo',
          value: `${COMPLAINT_TYPE_LABELS[c.type] ?? c.type}: ${
            COMPLAINT_TYPE_DEFINITIONS[c.type as keyof typeof COMPLAINT_TYPE_DEFINITIONS] ?? ''
          }`,
        },
        { label: 'Detalle', value: c.detail, multiline: true },
        { label: 'Pedido', value: c.request, multiline: true },
      ],
    },
  ]
}
