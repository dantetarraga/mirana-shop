import 'server-only'

import nodemailer, { type Transporter } from 'nodemailer'

// ---------------------------------------------------------------------------
// Envío de correo transaccional por SMTP (nodemailer).
//
// Configuración por entorno: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
// MAIL_FROM. Si falta SMTP_HOST el envío se omite con un warning y se
// devuelve { sent: false }: nunca lanza, para que un fallo de correo no
// deshaga la operación de negocio (p.ej. el reclamo ya registrado). Quien
// llama decide qué hacer con el resultado (guardar la fecha de envío,
// avisar al admin...).
// ---------------------------------------------------------------------------

export type MailMessage = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type MailResult = { sent: true; messageId: string } | { sent: false; reason: string }

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) return null
  if (cachedTransporter) return cachedTransporter

  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS ?? ''

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    // 465 = TLS implícito; el resto negocia STARTTLS si el servidor lo ofrece.
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return cachedTransporter
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim())
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('[mail] SMTP_HOST no configurado: se omite el envío de', message.subject)
    return { sent: false, reason: 'not-configured' }
  }

  const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim()
  if (!from) {
    console.warn('[mail] MAIL_FROM no configurado: se omite el envío de', message.subject)
    return { sent: false, reason: 'no-from' }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    return { sent: true, messageId: String(info.messageId ?? '') }
  } catch (err) {
    // Solo al log del servidor: el detalle SMTP puede incluir hosts/usuarios.
    console.error('[mail] Error al enviar', message.subject, err)
    return { sent: false, reason: 'send-failed' }
  }
}

/** Escapa texto para interpolarlo en el HTML de un correo. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
