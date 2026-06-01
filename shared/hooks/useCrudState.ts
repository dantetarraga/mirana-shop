'use client'

import { useState } from 'react'

/**
 * Maneja el estado común de tablas CRUD admin:
 * - qué ítem se está editando (`editing`)
 * - si el drawer está en modo "nuevo" (`isNew`)
 * - qué ítem se está viendo en el EntityProductsDrawer (`viewingId`)
 *
 * @example
 * const crud = useCrudState<BrandRow>()
 *
 * // Abrir para crear
 * crud.openNew()
 *
 * // Abrir para editar
 * crud.openEdit(brand)
 *
 * // En JSX
 * {crud.drawerOpen && (
 *   <BrandCrudDrawer isNew={crud.isNew} brand={crud.editing} onClose={crud.closeDrawer} />
 * )}
 */
export function useCrudState<T>() {
  const [editing, setEditing] = useState<T | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  const drawerOpen = isNew || editing !== null

  return {
    editing,
    viewingId,
    isNew,
    drawerOpen,
    openNew: () => {
      setEditing(null)
      setIsNew(true)
    },
    openEdit: (item: T) => {
      setIsNew(false)
      setEditing(item)
    },
    closeDrawer: () => {
      setEditing(null)
      setIsNew(false)
    },
    openViewing: (id: string) => {
      setEditing(null)
      setViewingId(id)
    },
    closeViewing: () => setViewingId(null),
  }
}
