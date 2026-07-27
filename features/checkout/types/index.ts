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
  /** Descuento aplicado por promociones o cupón (0 si no hubo) */
  discount: number
  discountName: string | null
  /** Cupón canjeado; null si el beneficio vino de una promoción automática */
  couponCode: string | null
  shippingCost: number
  /** Nombre de la forma de entrega elegida; null si la tienda no configuró ninguna */
  deliveryLabel: string | null
  /** Sede de retiro elegida, ya formateada; null si no aplica */
  deliveryLocation: string | null
  /** Lo que el cliente paga ahora */
  total: number
  /** Saldo pendiente por preventa parcial; 0 en pedidos normales */
  dueTotal: number
}
