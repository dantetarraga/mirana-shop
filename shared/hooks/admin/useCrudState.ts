'use client'

import { useReducer } from 'react'

type CrudState<T> =
  | { mode: 'idle' }
  | { mode: 'create' }
  | { mode: 'edit'; item: T }
  | { mode: 'delete'; item: T }
  | { mode: 'view'; id: string }

type CrudAction<T> =
  | { type: 'OPEN_NEW' }
  | { type: 'OPEN_EDIT'; item: T }
  | { type: 'OPEN_DELETE'; item: T }
  | { type: 'OPEN_VIEW'; id: string }
  | { type: 'CLOSE' }

export function useCrudState<T>() {
  const [state, dispatch] = useReducer(
    (s: CrudState<T>, a: CrudAction<T>): CrudState<T> => {
      switch (a.type) {
        case 'OPEN_NEW':
          return { mode: 'create' }
        case 'OPEN_EDIT':
          return { mode: 'edit', item: a.item }
        case 'OPEN_DELETE':
          return { mode: 'delete', item: a.item }
        case 'OPEN_VIEW':
          return { mode: 'view', id: a.id }
        case 'CLOSE':
          return { mode: 'idle' }
      }
    },
    { mode: 'idle' },
  )

  return {
    editing: state.mode === 'edit' ? state.item : null,
    isNew: state.mode === 'create',
    drawerOpen: state.mode === 'create' || state.mode === 'edit',
    pendingDelete: state.mode === 'delete' ? state.item : null,
    viewingId: state.mode === 'view' ? state.id : null,

    openNew: () => dispatch({ type: 'OPEN_NEW' }),
    openEdit: (item: T) => dispatch({ type: 'OPEN_EDIT', item }),
    openDelete: (item: T) => dispatch({ type: 'OPEN_DELETE', item }),
    openViewing: (id: string) => dispatch({ type: 'OPEN_VIEW', id }),
    closeDrawer: () => dispatch({ type: 'CLOSE' }),
    closeDelete: () => dispatch({ type: 'CLOSE' }),
    closeViewing: () => dispatch({ type: 'CLOSE' }),
  }
}
