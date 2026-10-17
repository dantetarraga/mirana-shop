import {
  canTransitionOrder,
  getOrderStatusMeta,
  ORDER_STATUS_TRANSITIONS,
} from '@/features/orders/lib/order-status'
import { describe, expect, it } from 'vitest'

describe('order status transitions', () => {
  it('allows the normal paid fulfillment flow', () => {
    expect(canTransitionOrder('AWAITING_PROOF', 'PAID')).toBe(true)
    expect(canTransitionOrder('PAID', 'PREPARING')).toBe(true)
    expect(canTransitionOrder('PREPARING', 'SHIPPED')).toBe(true)
    expect(canTransitionOrder('SHIPPED', 'DELIVERED')).toBe(true)
  })

  it('prevents reopening terminal orders or cancelling consumed inventory', () => {
    expect(ORDER_STATUS_TRANSITIONS.CANCELLED).toEqual([])
    expect(ORDER_STATUS_TRANSITIONS.REFUNDED).toEqual([])
    expect(canTransitionOrder('PAID', 'CANCELLED')).toBe(false)
    expect(canTransitionOrder('CANCELLED', 'PAID')).toBe(false)
  })
})

describe('getOrderStatusMeta', () => {
  it('usa la etiqueta del estado y el tono de su grupo', () => {
    const meta = getOrderStatusMeta('PREPARING')
    expect(meta.label).toBe('Preparando')
    expect(meta.group).toBe('pendiente')
    expect(meta.tone.cls).toBe('badge-amber')
    expect(getOrderStatusMeta('SHIPPED').tone.cls).toBe('badge-blue')
    expect(getOrderStatusMeta('REFUNDED').tone.cls).toBe('badge-red')
  })

  it('cae a "pendiente" ante un estado desconocido', () => {
    const meta = getOrderStatusMeta('FOO')
    expect(meta.group).toBe('pendiente')
    expect(meta.label).toBe('Pendiente')
  })
})
