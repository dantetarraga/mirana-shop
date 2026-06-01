/**
 * Cliente para la API de Culqi v2
 * Docs: https://apidocs.culqi.com/
 *
 * Solo se usa en el servidor (Server Actions, Route Handlers).
 * Nunca exponer CULQI_SECRET_KEY en el cliente.
 */

const CULQI_BASE_URL = 'https://api.culqi.com/v2'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type CulqiOrderInput = {
  amount: number // en céntimos, ej: 6000 = S/ 60.00
  currency_code: string // "PEN"
  description: string
  order_number: string // único, ej: "MIR-2026-0001"
  expiration_date: number // Unix timestamp (epoch seconds)
  client_details: {
    first_name: string
    last_name: string
    email: string
    phone_number: string
  }
  confirm?: boolean
  metadata?: Record<string, string>
}

export type CulqiOrderResponse = {
  object: 'order'
  id: string
  amount: number
  payment_code: string | null
  currency_code: string
  description: string
  order_number: string
  state: 'created' | 'pending' | 'paid' | 'expired' | 'deleted'
  creation_date: number
  expiration_date: number
  qr: string | null
  url_pe: string | null
  cuotealo: unknown | null
}

export type CulqiChargeInput = {
  amount: number
  currency_code: string
  description: string
  source_id: string // token de Culqi.js
  email: string
  metadata?: Record<string, string>
  capture?: boolean
}

export type CulqiChargeResponse = {
  object: 'charge'
  id: string
  amount: number
  currency_code: string
  description: string
  email: string
  outcome: {
    type: string // "venta_exitosa" | "tarjeta_rechazada"
    code: string
    decline_code?: string
    merchant_message: string
    user_message: string
  }
  source: {
    id: string
    object: string
    card_number: string
  }
  creation_date: number
}

type CulqiErrorResponse = {
  object: 'error'
  type: string
  merchant_message: string
  user_message?: string
  code?: string
  decline_code?: string
}

// ---------------------------------------------------------------------------
// Helper de request
// ---------------------------------------------------------------------------

async function culqiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const secretKey = process.env.CULQI_SECRET_KEY
  if (!secretKey) {
    throw new Error('CULQI_SECRET_KEY no está definida en las variables de entorno')
  }

  const res = await fetch(`${CULQI_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const json = await res.json()

  if (!res.ok) {
    const err = json as CulqiErrorResponse
    throw new Error(err.user_message ?? err.merchant_message ?? `Culqi error ${res.status}`)
  }

  return json as T
}

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

/**
 * Crea una orden en Culqi para Yape / PagoEfectivo / Cuotéalo.
 * Retorna el objeto orden con QR y URL de PagoEfectivo.
 */
export async function createCulqiOrder(input: CulqiOrderInput): Promise<CulqiOrderResponse> {
  return culqiRequest<CulqiOrderResponse>('POST', '/orders', input)
}

/**
 * Confirma una orden creada con confirm=false.
 */
export async function confirmCulqiOrder(culqiOrderId: string): Promise<CulqiOrderResponse> {
  return culqiRequest<CulqiOrderResponse>('POST', `/orders/${culqiOrderId}/confirm`, {})
}

/**
 * Obtiene el estado actual de una orden de Culqi.
 */
export async function getCulqiOrder(culqiOrderId: string): Promise<CulqiOrderResponse> {
  return culqiRequest<CulqiOrderResponse>('GET', `/orders/${culqiOrderId}`)
}

// ---------------------------------------------------------------------------
// Charges API
// ---------------------------------------------------------------------------

/**
 * Crea un cargo a una tarjeta usando un token de Culqi.js.
 */
export async function createCulqiCharge(input: CulqiChargeInput): Promise<CulqiChargeResponse> {
  return culqiRequest<CulqiChargeResponse>('POST', '/charges', input)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte un monto en soles (número) a céntimos para Culqi (entero). */
export function toCulqiAmount(soles: number): number {
  return Math.round(soles * 100)
}

/** Genera una fecha de expiración en Unix timestamp (por defecto: 24 horas). */
export function culqiExpiration(hoursFromNow = 24): number {
  return Math.floor(Date.now() / 1000) + hoursFromNow * 3600
}
