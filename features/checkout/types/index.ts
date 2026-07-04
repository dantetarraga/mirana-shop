export type SuccessItem = {
  name: string
  qty: number
  unitPrice: number
}

export type SuccessData = {
  code: string
  paymentMethod: string
  items: SuccessItem[]
  subtotal: number
  /** Descuento aplicado por promociones (0 si no hubo) */
  discount: number
  discountName: string | null
  shippingCost: number
  total: number
}
