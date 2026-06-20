'use client'

import type { UserRow } from '@/app/admin/users/page'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { DrawerSection } from '@/shared/components/admin/DrawerSection'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
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

const SEGMENT_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vip', label: 'VIP' },
  { key: 'activo', label: 'Activos' },
  { key: 'nuevo', label: 'Nuevos' },
]

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return qs ? `/admin/users?${qs}` : '/admin/users'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UsersClientProps {
  users: UserRow[]
  total: number
  currentPage: number
  perPage: number
  currentQ: string
  currentSegment: string
}

// ---------------------------------------------------------------------------
// Component — sin filtros client-side
// ---------------------------------------------------------------------------

export function UsersClient({
  users,
  total,
  currentPage,
  perPage,
  currentQ,
  currentSegment,
}: UsersClientProps) {
  const [detail, setDetail] = useState<UserRow | null>(null)
  const totalPages = Math.ceil(total / perPage)

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
    <div className="px-8 pt-7 pb-12">
      {/* Filtros server-side */}
      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <ServerSearchForm
          placeholder="Buscar usuario..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={currentSegment !== 'todos' ? { segment: currentSegment } : {}}
        />

        <div className="flex gap-1.5">
          {SEGMENT_TABS.map(({ key, label }) => {
            const isActive = key === currentSegment
            const href = buildUrl({
              q: currentQ || undefined,
              segment: key !== 'todos' ? key : undefined,
            })
            return (
              <a
                key={key}
                href={href}
                className={cn(
                  'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                  isActive
                    ? 'bg-(--gold) border-(--gold) text-black'
                    : 'border-(--bd) text-muted hover:text-text',
                )}
              >
                {label}
              </a>
            )
          })}
        </div>

        {(currentQ || currentSegment !== 'todos') && (
          <a
            href="/admin/users"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}

        <span className="ml-auto text-[12px] text-muted">
          {total} usuario{total !== 1 ? 's' : ''}
        </span>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        onRowClick={setDetail}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                segment: currentSegment !== 'todos' ? currentSegment : undefined,
                page: String(p),
              })}
              className={cn(
                'px-3 py-1.5 text-[13px] border transition-colors',
                p === currentPage
                  ? 'bg-(--gold) border-(--gold) text-black font-bold'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}

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
    </div>
  )
}
