/** La creación y el vencimiento de pedidos antiguos comparten el mismo plazo. */
export function orderReservationTtlMinutes(): number {
  const value = Number(process.env.ORDER_RESERVATION_TTL_MINUTES ?? 60)
  return Number.isFinite(value) ? Math.min(24 * 60, Math.max(10, Math.floor(value))) : 60
}
