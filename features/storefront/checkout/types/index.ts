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
  /** Número de tarjeta enmascarado (CULQI_CARD) */
  cardNumber?: string
  culqi?:
    | {
        orderId: string
        qrUrl: string | null
        peUrl: string | null
        paymentCode: string | null
      }
    | undefined
}
