// ---------------------------------------------------------------------------
// Casillas jerárquicas de categoría del catálogo (máx. 2 niveles).
//
// En la URL un padre equivale a "todas sus hijas" (el filtro por slug incluye
// las subcategorías), así que la selección se guarda normalizada:
//   - padre marcado          → solo el slug del padre
//   - algunas hijas marcadas → los slugs de esas hijas (padre indeterminado)
//   - todas las hijas        → se colapsa al padre
// ---------------------------------------------------------------------------

export type CheckState = 'checked' | 'indeterminate' | 'unchecked'

export function parentCheckState(
  selected: readonly string[],
  parent: string,
  children: readonly string[],
): CheckState {
  if (selected.includes(parent)) return 'checked'
  const picked = children.filter((c) => selected.includes(c)).length
  if (picked === 0) return 'unchecked'
  return picked === children.length ? 'checked' : 'indeterminate'
}

export function isChildChecked(selected: readonly string[], parent: string, child: string): boolean {
  return selected.includes(parent) || selected.includes(child)
}

/** Marcar el padre selecciona toda la rama; desmarcarlo la quita entera. */
export function toggleParent(
  selected: readonly string[],
  parent: string,
  children: readonly string[],
): string[] {
  const branch = new Set([parent, ...children])
  const rest = selected.filter((s) => !branch.has(s))
  return parentCheckState(selected, parent, children) === 'checked' ? rest : [...rest, parent]
}

export function toggleChild(
  selected: readonly string[],
  parent: string,
  children: readonly string[],
  child: string,
): string[] {
  const branch = new Set([parent, ...children])
  const rest = selected.filter((s) => !branch.has(s))
  const current = selected.includes(parent)
    ? [...children]
    : children.filter((c) => selected.includes(c))

  const next = current.includes(child) ? current.filter((c) => c !== child) : [...current, child]
  if (children.length > 0 && next.length === children.length) return [...rest, parent]
  return [...rest, ...next]
}
