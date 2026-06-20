// ---------------------------------------------------------------------------
// ActionResult — tipo global para Server Actions
// ---------------------------------------------------------------------------
//
// Semántica de códigos (similar a HTTP):
//   400 — Bad Request:          input inválido o parámetros faltantes
//   404 — Not Found:            recurso no encontrado
//   409 — Conflict:             slug/SKU duplicado, bloqueo optimista
//   422 — Unprocessable Entity: regla de negocio violada
//   500 — Internal Server Error: error inesperado del servidor
// ---------------------------------------------------------------------------

export type ActionErrorCode = 400 | 404 | 409 | 422 | 500

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: ActionErrorCode }
