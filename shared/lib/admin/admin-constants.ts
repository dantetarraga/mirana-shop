export type Module = 'dashboard' | 'orders' | 'products' | 'inventory' | 'banners' | 'users'

export const ORDER_STATUS: Record<
  string,
  { label: string; color: string; bg: string; cls: string; outlineCls: string; btnCls: string }
> = {
  pendiente: {
    label: 'Pendiente',
    color: '#ffb84a',
    bg: 'rgba(255,184,74,.12)',
    cls: 'badge-amber',
    outlineCls: 'badge-amber-outline',
    btnCls: 'btn-status-amber',
  },
  enviado: {
    label: 'Enviado',
    color: '#5f9eff',
    bg: 'rgba(95,158,255,.12)',
    cls: 'badge-blue',
    outlineCls: 'badge-blue-outline',
    btnCls: 'btn-status-blue',
  },
  entregado: {
    label: 'Entregado',
    color: '#3fcf7f',
    bg: 'rgba(63,207,127,.12)',
    cls: 'badge-green',
    outlineCls: 'badge-green-outline',
    btnCls: 'btn-status-green',
  },
  cancelado: {
    label: 'Cancelado',
    color: '#ff6644',
    bg: 'rgba(255,102,68,.12)',
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
    color: 'var(--gold)',
    cls: 'badge-gold',
    outlineCls: 'badge-gold-outline',
    textCls: 'text-(--gold)',
  },
  activo: {
    label: 'Activo',
    color: '#3fcf7f',
    cls: 'badge-green',
    outlineCls: 'badge-green-outline',
    textCls: 'text-[#3fcf7f]',
  },
  nuevo: {
    label: 'Nuevo',
    color: '#5f9eff',
    cls: 'badge-blue',
    outlineCls: 'badge-blue-outline',
    textCls: 'text-[#5f9eff]',
  },
}

export const BANNER_STATUS: Record<
  string,
  { label: string; color: string; cls: string; outlineCls: string }
> = {
  activo: {
    label: 'Activo',
    color: '#3fcf7f',
    cls: 'badge-green',
    outlineCls: 'badge-green-outline',
  },
  programado: {
    label: 'Programado',
    color: '#5f9eff',
    cls: 'badge-blue',
    outlineCls: 'badge-blue-outline',
  },
  inactivo: {
    label: 'Inactivo',
    color: '#ff6644',
    cls: 'badge-red',
    outlineCls: 'badge-red-outline',
  },
}

import { formatDate } from '@/shared/lib/utils'

export const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtDate = (d: string) => formatDate(d + 'T00:00', 'd MMM')
