import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'

export type OrderItemRow = {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: Decimal
}

export type OrderListItem = {
  id: string
  code: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  total: Decimal
  subtotal: Decimal
  shippingCost: Decimal
  currency: string
  createdAt: Date
  updatedAt: Date
  user: { id: string; name: string | null; email: string } | null
  guestEmail: string | null
  shipping: { fullName: string; city: string; district: string; phone: string } | null
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
