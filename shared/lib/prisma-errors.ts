// ---------------------------------------------------------------------------
// Errores de Prisma → mensajes de negocio.
//
// Las actions nunca deben devolver `err.message` crudo: filtra nombres de
// tablas e índices ("Unique constraint failed on the constraint:
// `Category_parentId_name_key`") y no le dice al admin qué hacer.
//
// Se reconoce el error por su `code` (duck typing) en vez de `instanceof`
// para no arrastrar el runtime del cliente generado a los tests.
// ---------------------------------------------------------------------------

export interface PrismaErrorMessages {
  /** P2002 — valor duplicado en un índice único. */
  unique?: string
  /** P2003 / P2014 — una referencia (FK) no existe o hay filas que dependen. */
  foreignKey?: string
  /** P2025 — la fila a actualizar/borrar no existe. */
  notFound?: string
  /** Cualquier otro error. */
  fallback: string
}

export function prismaErrorCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null || !('code' in err)) return null
  const code = (err as { code: unknown }).code
  return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : null
}

/** Mensaje para el admin según el tipo de error de Prisma. */
export function prismaErrorMessage(err: unknown, messages: PrismaErrorMessages): string {
  switch (prismaErrorCode(err)) {
    case 'P2002':
      return messages.unique ?? messages.fallback
    case 'P2003':
    case 'P2014':
      return messages.foreignKey ?? messages.fallback
    case 'P2025':
      return messages.notFound ?? messages.fallback
    default:
      return messages.fallback
  }
}

/** Código del ActionResult que corresponde al error. */
export function prismaErrorStatus(err: unknown): 404 | 409 | 422 | 500 {
  switch (prismaErrorCode(err)) {
    case 'P2002':
      return 409
    case 'P2003':
    case 'P2014':
      return 422
    case 'P2025':
      return 404
    default:
      return 500
  }
}

/** Atajo: `{ success: false, error, code }` listo para devolver desde una action. */
export function prismaFailure(err: unknown, messages: PrismaErrorMessages) {
  return {
    success: false as const,
    error: prismaErrorMessage(err, messages),
    code: prismaErrorStatus(err),
  }
}
