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
  shippingCost: number
  total: number
}
