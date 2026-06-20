'use client'

import type { UserRow } from '@/features/users/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { DrawerSection } from '@/shared/components/admin/DrawerSection'
import { StatusBadge } from '@/features/orders/components/StatusBadge'
import { cls } from '@/shared/lib/admin/admin-classes'
import { USER_STATUS } from '@/shared/lib/admin/admin-constants'
import { cn, formatDate } from '@/shared/lib/utils'
import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserSegment = 'vip' | 'activo' | 'nuevo'

function getSegment(user: UserRow): UserSegment {
  const n = user._count.orders
  if (n >= 10) return 'vip'
  if (n >= 1) return 'activo'
  return 'nuevo'
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  CUSTOMER: 'Cliente',
}

// ---------------------------------------------------------------------------
// Props — solo la tabla + drawer de detalle son interactivos.
// El chrome (búsqueda, tabs, paginación) vive en page.tsx (server).
// ---------------------------------------------------------------------------

interface UsersClientProps {
  users: UserRow[]
}

export function UsersClient({ users }: UsersClientProps) {
  const [detail, setDetail] = useState<UserRow | null>(null)

  const columns = useMemo<Column<UserRow>[]>(
    () => [
      {
        header: 'Usuario',
        render: (u) => (
          <div className="flex items-center gap-3">
            <div className="w-9.5 h-9.5 flex items-center justify-center font-display font-black text-[14px] shrink-0 bg-card-hover border border-(--bd) text-(--gold)">
              {(u.name ?? u.email)
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className={cls.rowName}>{u.name ?? 'Sin nombre'}</div>
              <div className="text-[11px] text-muted">{u.email}</div>
            </div>
          </div>
        ),
      },
      { header: 'Pedidos', className: cls.val, render: (u) => u._count.orders },
      {
        header: 'Rol',
        render: (u) => <span className="text-[13px]">{ROLE_LABELS[u.role] ?? u.role}</span>,
      },
      {
        header: 'Desde',
        className: 'text-[13px] text-muted',
        render: (u) => formatDate(new Date(u.createdAt), 'MMM yyyy'),
      },
      {
        header: 'Segmento',
        render: (u) => {
          const seg = getSegment(u)
          return <StatusBadge config={USER_STATUS[seg] ?? USER_STATUS.nuevo} variant="outlined" />
        },
      },
    ],
    [],
  )

  return (
    <>
      <AdminTable columns={columns} data={users} keyExtractor={(u) => u.id} onRowClick={setDetail} />

      {/* Drawer de detalle */}
      {detail && (
        <AdminDrawer
          title={detail.name ?? 'Usuario'}
          sub="Perfil de cliente"
          onClose={() => setDetail(null)}
        >
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                ['Pedidos', detail._count.orders],
                ['Segmento', USER_STATUS[getSegment(detail)]?.label ?? '—'],
              ] as [string, string | number][]
            ).map(([l, v]) => (
              <div key={l} className="p-3.5 text-center bg-card border border-(--bd)">
                <div className="font-display text-[24px] font-black leading-none">{v}</div>
                <div className="text-[9px] tracking-[1px] uppercase mt-1.25 text-muted">{l}</div>
              </div>
            ))}
          </div>

          <DrawerSection title="Información">
            {(
              [
                ['Email', detail.email],
                ['Rol', ROLE_LABELS[detail.role] ?? detail.role],
                ['Cliente desde', formatDate(new Date(detail.createdAt), "d 'de' MMMM 'de' yyyy")],
                ['Segmento', USER_STATUS[getSegment(detail)]?.label ?? '—'],
              ] as [string, string][]
            ).map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px] py-1.5">
                <span className="text-muted">{l}</span>
                <span
                  className={
                    l === 'Segmento'
                      ? cn('font-bold', USER_STATUS[getSegment(detail)]?.textCls ?? '')
                      : 'text-text'
                  }
                >
                  {v}
                </span>
              </div>
            ))}
          </DrawerSection>
        </AdminDrawer>
      )}
    </>
  )
}
