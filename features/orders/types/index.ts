import type {
  DeliveryKind,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PreorderMode,
} from '@/generated/prisma/client'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'

export type OrderItemRow = {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: Decimal
  /** Se vendió como preventa (el stock fue a preorderedStock) */
  isPreorder: boolean
  preorderMode: PreorderMode
  /** Adelanto por unidad cobrado; null si se pagó completo */
  depositUnitPrice: Decimal | null
}

export type OrderListItem = {
  id: string
  code: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  /** Lo que el cliente pagó ahora (el adelanto, si hubo preventa parcial) */
  total: Decimal
  /** Valor completo del pedido */
  subtotal: Decimal
  shippingCost: Decimal
  /** Descuento aplicado por una promoción o un cupón */
  discountTotal: Decimal
  /** Saldo pendiente por preventa parcial; 0 en pedidos normales */
  dueTotal: Decimal
  /** Cuándo el admin marcó el saldo como cobrado; null = pendiente */
  duePaidAt: Date | null
  currency: string
  createdAt: Date
  updatedAt: Date
  /** Snapshot del nombre de la forma de entrega; '' en pedidos anteriores */
  deliveryMethodName: string
  deliveryKind: DeliveryKind
  /** Sede de retiro elegida, ya formateada; null si no aplica */
  deliveryLocation: string | null
  /** Cupón canjeado; null si no hubo */
  couponCode: string | null
  user: { id: string; name: string | null; email: string } | null
  guestEmail: string | null
  shipping: {
    fullName: string
    city: string
    district: string
    phone: string
    dni: string
    address: string
    reference: string | null
  } | null
  _count: { items: number }
}

export type OrderDetail = OrderListItem & {
  items: OrderItemRow[]
  payment: {
    id: string
    method: string
    status: PaymentStatus
    amount: Decimal
    proofUrl: string | null
  } | null
  notes: string | null
  paidAt: Date | null
  cancelledAt: Date | null
}

export type OrderStatusGroup = 'pendiente' | 'enviado' | 'entregado' | 'cancelado'

export type CreateOrderInput = {
  guestEmail?: string
  userId?: string
  paymentMethod: PaymentMethod
  items: Array<{
    productId: string
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  shippingCost: number
  total: number
  shipping: {
    fullName: string
    phone: string
    address: string
    district: string
    city: string
    reference?: string
  }
}

export type OrderFilters = {
  status?: OrderStatus
  statusGroup?: OrderStatusGroup
  paymentStatus?: PaymentStatus
  search?: string
  take?: number
  skip?: number
}
