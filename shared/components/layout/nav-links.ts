import { MapPin, Package, User } from 'lucide-react'

export interface NavLinkItem {
  label: string
  href: string
}

/** Enlaces de la cuenta — compartidos por el menú del avatar y el drawer móvil. */
export const ACCOUNT_LINKS = [
  { label: 'Mi perfil', icon: User, href: '/cuenta/perfil' },
  { label: 'Mis pedidos', icon: Package, href: '/cuenta/pedidos' },
  { label: 'Mis direcciones', icon: MapPin, href: '/cuenta/direcciones' },
] as const
