'use client'

import {
  limitMenuChildren,
  MENU_MAX_ROOTS,
  MENU_OVERFLOW_LABEL,
  splitMenuRoots,
} from '@/features/categories/lib/menu-limits'
import { buildMenuTree, filterPublicNodes } from '@/features/categories/lib/menu-tree'
import { totalsWithDescendants } from '@/features/categories/lib/category-tree'
import type { AdminCategoryRow, MenuCategory } from '@/features/categories/types'
import { cls } from '@/shared/lib/admin/admin-classes'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// Vista previa del menú "Tienda" del Navbar, calculada con las MISMAS
// funciones que la tienda (buildMenuTree + límites): lo que se ve aquí es lo
// que verá el cliente. Usa los conteos públicos (estados visibles del
// catálogo), no los del admin.
// ---------------------------------------------------------------------------

interface Props {
  rows: AdminCategoryRow[]
}

export function MenuPreviewPanel({ rows }: Props) {
  const { menu, warnings } = useMemo(() => analyze(rows), [rows])
  const { bar, overflow } = splitMenuRoots(menu)

  return (
    <aside
      aria-labelledby="menu-preview-title"
      className="bg-card border border-(--bd) xl:sticky xl:top-6"
    >
      <div className="px-5 pt-4.5 pb-3.5 border-b border-(--bd)">
        <div className={cls.label}>Tienda</div>
        <h2 id="menu-preview-title" className="font-display text-[18px] font-black uppercase tracking-tight">
          Vista previa del menú
        </h2>
        <p className="text-[12px] text-muted mt-1">
          Lo que ve el cliente al abrir «Tienda» en escritorio.
        </p>
      </div>

      {/* La barra: raíces en orden y el desborde "Más". */}
      <div className="px-5 py-4 border-b border-(--bd)">
        {bar.length === 0 ? (
          <p className="text-[13px] text-muted">
            Ninguna categoría aparece en el menú. Activa «En menú» en una categoría principal con
            productos visibles.
          </p>
        ) : (
          <ol className="flex flex-wrap gap-1.5" aria-label="Categorías en la barra">
            {bar.map((root) => (
              <li
                key={root.id}
                className="font-display font-extrabold text-[13px] uppercase tracking-[0.5px] px-2.5 py-1 border border-(--bd) bg-surf"
              >
                {root.name}
              </li>
            ))}
            {overflow.length > 0 && (
              <li className="font-display font-extrabold text-[13px] uppercase tracking-[0.5px] px-2.5 py-1 border border-border-gold text-accent-ink inline-flex items-center gap-1">
                {MENU_OVERFLOW_LABEL}
                <ChevronDown size={13} aria-hidden />
                <span className="sr-only">: {overflow.map((o) => o.name).join(', ')}</span>
              </li>
            )}
          </ol>
        )}
      </div>

      {/* Columnas del panel desplegado. */}
      {bar.length > 0 && (
        <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-4 border-b border-(--bd)">
          {bar.map((root) => (
            <PreviewColumn key={root.id} root={root} />
          ))}
        </div>
      )}

      {overflow.length > 0 && (
        <div className="px-5 py-3.5 border-b border-(--bd)">
          <div className="text-[12px] text-muted mb-1.5">Dentro de «{MENU_OVERFLOW_LABEL}»</div>
          <ul className="text-[13px] flex flex-col gap-0.5">
            {overflow.map((root) => (
              <li key={root.id}>{root.name}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="px-5 py-4 flex flex-col gap-2.5" aria-label="Avisos del menú">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 text-[12px] text-muted">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

function PreviewColumn({ root }: { root: MenuCategory }) {
  const { shown, hasMore } = limitMenuChildren(root.children)
  return (
    <div className="min-w-0">
      <div className="font-display font-black text-[13px] uppercase truncate">{root.name}</div>
      <ul className="mt-1 flex flex-col gap-0.5 text-[12px] text-muted">
        {shown.map((c) => (
          <li key={c.id} className="truncate">
            {c.name}
          </li>
        ))}
        {(hasMore || shown.length > 0) && (
          <li className="text-accent-ink truncate">Ver todo {root.name}</li>
        )}
      </ul>
    </div>
  )
}

function analyze(rows: AdminCategoryRow[]) {
  // La tienda cuenta solo los productos públicos.
  const publicRows = rows.map((r) => ({ ...r, productCount: r.publicProductCount }))
  const nodes = filterPublicNodes(publicRows)
  const menu = buildMenuTree(nodes)
  const totals = totalsWithDescendants(nodes, (n) => n.productCount)

  const warnings: string[] = []
  if (menu.length > MENU_MAX_ROOTS) {
    warnings.push(
      `Solo se ven ${MENU_MAX_ROOTS} en escritorio; el resto va a «${MENU_OVERFLOW_LABEL}». Arrastra para elegir cuáles quedan delante.`,
    )
  }

  const visibleIds = new Set(nodes.map((n) => n.id))
  for (const root of rows.filter((r) => !r.parentId && r.showInMenu)) {
    if (!visibleIds.has(root.id)) {
      warnings.push(`«${root.name}» está oculta: no aparece aunque esté marcada en el menú.`)
    } else if ((totals.get(root.id) ?? 0) === 0) {
      warnings.push(`«${root.name}» no aparece: no tiene productos visibles en la tienda.`)
    }
  }

  const emptyChildren = nodes.filter(
    (n) => n.parentId && (totals.get(n.id) ?? 0) === 0 && menu.some((m) => m.id === n.parentId),
  )
  if (emptyChildren.length > 0) {
    warnings.push(
      `${emptyChildren.length === 1 ? 'La subcategoría' : 'Las subcategorías'} ${emptyChildren
        .map((c) => `«${c.name}»`)
        .join(', ')} no ${emptyChildren.length === 1 ? 'aparece' : 'aparecen'}: sin productos visibles.`,
    )
  }

  return { menu, warnings }
}
