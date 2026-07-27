import { getWhatsappPhone } from '@/features/settings/queries/store-settings.queries'
import { WhatsAppFloatClient } from './WhatsAppFloatClient'

// ---------------------------------------------------------------------------
// Botón flotante de WhatsApp — siempre visible en el storefront.
// El número se administra en /admin/settings (fallback: env legacy);
// si no está configurado, no se renderiza.
// ---------------------------------------------------------------------------

const DEFAULT_MESSAGE = '¡Hola MIRANA! Tengo una consulta.'

export async function WhatsAppFloat() {
  const phone = await getWhatsappPhone()
  if (!phone) return null

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`
  return <WhatsAppFloatClient href={href} />
}
