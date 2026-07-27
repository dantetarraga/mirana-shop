import type { PreorderMode } from '@/features/checkout/lib/preorder'
import type { CatalogProduct } from '@/features/products/types/catalog.types'

export type CartLine = {
  product: CatalogProduct
  qty: number
  /**
   * Cómo se paga esta línea. Solo cambia algo en productos de preventa que
   * admiten adelanto — en el resto siempre es 'FULL'.
   */
  preorderMode: PreorderMode
}
