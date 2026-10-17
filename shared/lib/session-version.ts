// ---------------------------------------------------------------------------
// Versión de sesión (revocación de JWT).
//
// La sesión es JWT: sin esto, un token robado o antiguo seguía valiendo hasta
// que expiraba. Cada User tiene `sessionVersion` en la BD y el token guarda la
// versión vigente al iniciar sesión (`sv`). Incrementar la columna invalida de
// golpe todos los tokens emitidos de esa cuenta.
//
// Funciones puras (sin BD ni Auth.js) para poder testearlas y usarlas tanto en
// auth.ts como en los guards de shared/lib.
// ---------------------------------------------------------------------------

/** Cada cuánto el callback jwt de auth.ts vuelve a contrastar el token con la BD. */
export const SESSION_RECHECK_MS = 5 * 60_000

/**
 * Normaliza el `sv` del token. Los tokens emitidos antes de esta funcionalidad
 * no lo traen y cuentan como 0 (el default de la columna), para que el
 * despliegue no cierre las sesiones en curso. "Cerrar todas las sesiones"
 * sube la versión de todos y sí las revoca.
 */
export function tokenSessionVersion(sv: unknown): number {
  return typeof sv === 'number' && Number.isInteger(sv) && sv >= 0 ? sv : 0
}

/** true si la versión del token coincide con la vigente en la BD. */
export function isSessionVersionValid(tokenSv: unknown, dbSv: number): boolean {
  return tokenSessionVersion(tokenSv) === dbSv
}

/** true si toca volver a validar el token contra la BD. */
export function shouldRecheckSession(
  checkedAt: unknown,
  now: number,
  intervalMs: number = SESSION_RECHECK_MS,
): boolean {
  if (typeof checkedAt !== 'number' || !Number.isFinite(checkedAt)) return true
  // Un checkedAt en el futuro (reloj movido o token manipulado) no debe
  // posponer la validación indefinidamente.
  if (checkedAt > now) return true
  return now - checkedAt >= intervalMs
}
