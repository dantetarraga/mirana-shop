import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Store de UI — controla el modal de detalle rápido de producto.
// ---------------------------------------------------------------------------

interface ProductModalState {
  activeProduct: CatalogProduct | null
  openProductModal: (product: CatalogProduct) => void
  closeProductModal: () => void
}

export const useProductModalStore = create<ProductModalState>((set) => ({
  activeProduct: null,
  openProductModal: (product) => set({ activeProduct: product }),
  closeProductModal: () => set({ activeProduct: null }),
}))
