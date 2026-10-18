export type Module = 'dashboard' | 'orders' | 'products' | 'inventory' | 'banners' | 'users'

export const ORDER_STATUS: Record<
  string,
  { label: string; color: string; bg: string; cls: string; outlineCls: string; btnCls: string }
> = {
  // Colores como var(): siguen el tema (claro usa tonos más oscuros, ver
  // globals.css). `color`/`bg` son para estilos inline (puntos de leyenda).
  pendiente: {
    label: 'Pendiente',
    color: 'var(--c-amber)',
    bg: 'color-mix(in srgb, var(--c-amber) 12%, transparent)',
    cls: 'badge-amber',
    outlineCls: 'badge-amber-outline',
    btnCls: 'btn-status-amber',
  },
  enviado: {
    label: 'Enviado',
    color: 'var(--c-blue)',
    bg: 'color-mix(in srgb, var(--c-blue) 12%, transparent)',
    cls: 'badge-blue',
    outlineCls: 'badge-blue-outline',
    btnCls: 'btn-status-blue',
  },
  entregado: {
    label: 'Entregado',
    color: 'var(--c-green)',
    bg: 'color-mix(in srgb, var(--c-green) 12%, transparent)',
    cls: 'badge-green',
    outlineCls: 'badge-green-outline',
    btnCls: 'btn-status-green',
  },
  cancelado: {
    label: 'Cancelado',
    color: 'var(--c-red)',
    bg: 'color-mix(in srgb, var(--c-red) 12%, transparent)',
    cls: 'badge-red',
    outlineCls: 'badge-red-outline',
    btnCls: 'btn-status-red',
  },
}

export const USER_STATUS: Record<
  string,
  { label: string; color: string; cls: string; outlineCls: string; textCls: string }
> = {
  vip: {
    label: 'VIP',
    color: 'var(--accent-ink)',
    cls: 'badge-gold',
    outlineCls: 'badge-gold-outline',
    textCls: 'text-accent-ink',
  },
  activo: {
    label: 'Activo',
    color: 'var(--c-green)',
    cls: 'badge-green',
    outlineCls: 'badge-green-outline',
    textCls: 'text-success',
  },
  nuevo: {
    label: 'Nuevo',
    color: 'var(--c-blue)',
    cls: 'badge-blue',
    outlineCls: 'badge-blue-outline',
    textCls: 'text-info',
  },
}

export const BANNER_STATUS: Record<
  string,
  { label: string; color: string; cls: string; outlineCls: string }
> = {
  activo: {
    label: 'Activo',
    color: 'var(--c-green)',
    cls: 'badge-green',
    outlineCls: 'badge-green-outline',
  },
  programado: {
    label: 'Programado',
    color: 'var(--c-blue)',
    cls: 'badge-blue',
    outlineCls: 'badge-blue-outline',
  },
  inactivo: {
    label: 'Inactivo',
    color: 'var(--c-red)',
    cls: 'badge-red',
    outlineCls: 'badge-red-outline',
  },
}

import { formatDate } from '@/shared/lib/utils'

export const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtDate = (d: string) => formatDate(d + 'T00:00', 'd MMM')
