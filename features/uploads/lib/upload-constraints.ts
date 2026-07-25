// ---------------------------------------------------------------------------
// Límites de subida compartidos por cliente y servidor.
//
// El servidor (uploadImage) es quien manda —es un endpoint público—, pero el
// cliente valida con los mismos números para no gastar una petición en un
// archivo que va a ser rechazado.
// ---------------------------------------------------------------------------

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

/** Valor del atributo `accept` de los <input type="file">. */
export const UPLOAD_ACCEPT = ALLOWED_UPLOAD_TYPES.join(',')

export function describeUploadLimits(): string {
  return `JPG, PNG, WEBP o AVIF · máx. ${MAX_UPLOAD_BYTES / 1024 / 1024}MB por imagen`
}
