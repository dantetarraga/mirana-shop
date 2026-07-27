'use client'

import {
  deleteHomeSection,
  toggleHomeSection,
} from '@/features/home-sections/actions/home-section.actions'
import { HomeSectionDrawer } from '@/features/home-sections/components/HomeSectionDrawer'
import type { HomeSectionRow } from '@/features/home-sections/types'
import { HOME_SECTION_DEFAULT_HREF } from '@/features/home-sections/types'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { Eye, EyeOff, LayoutList, Link2, Package, Pencil, Plus, Trash2 } from 'lucide-react'

interface Props {
  sections: HomeSectionRow[]
}

// ---------------------------------------------------------------------------
// Secciones del inicio: el admin crea la cabecera y los productos se enlazan
// desde la ficha de cada producto (bloque "Secciones del inicio"), igual que
// las colecciones. Acá solo se define qué se muestra, en qué orden y a dónde
// lleva el "Ver todos".
// ---------------------------------------------------------------------------

export function HomeSectionsClient({ sections }: Props) {
  const crud = useEntityCrud<HomeSectionRow>(deleteHomeSection, (s) => `"${s.title}" eliminada`)

  const toggle = (s: HomeSectionRow) =>
    crud.run(() => toggleHomeSection(s.id, s.active), {
      successMsg: s.active ? `"${s.title}" oculta del inicio` : `"${s.title}" visible en el inicio`,
      refresh: true,
    })

  const visibleCount = sections.filter((s) => s.active).length

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Contenido"
        title={`${visibleCount} sección${visibleCount !== 1 ? 'es' : ''} visible${visibleCount !== 1 ? 's' : ''} en el inicio`}
        align="center"
        side={
          <Button variant="accent" size="sm" onClick={crud.openNew}>
            <Plus size={13} className="mr-1.5" /> Nueva sección
          </Button>
        }
      />

      <div className="max-w-200 flex flex-col gap-4">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted gap-3 border border-dashed border-(--bd)">
            <LayoutList size={48} strokeWidth={1} aria-hidden />
            <p className="text-[14px]">Todavía no hay secciones.</p>
            <p className="text-[12px] max-w-100 text-center">
              Crea una y después enlaza los productos desde la ficha de cada producto. El inicio
              sigue mostrando Novedades y Favoritos aunque no crees ninguna.
            </p>
            <Button variant="accent" size="sm" onClick={crud.openNew}>
              <Plus size={13} className="mr-1.5" /> Crear la primera
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sections.map((s) => (
              <li
                key={s.id}
                className={cn(
                  'bg-card border border-(--bd) p-5 flex items-start gap-4',
                  !s.active && 'opacity-55',
                )}
              >
                <div className="w-9 h-9 shrink-0 bg-surf border border-(--bd) flex items-center justify-center font-display font-black text-[13px] text-accent-ink">
                  {s.position}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cls.rowName}>{s.title}</span>
                    {!s.active && (
                      <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                        Oculta
                      </span>
                    )}
                    {s.productCount === 0 && (
                      <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                        Sin productos
                      </span>
                    )}
                  </div>
                  {s.eyebrow && <p className="text-[12px] text-muted mt-1">{s.eyebrow}</p>}

                  <div className="flex items-center gap-4 flex-wrap mt-1.5 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Package size={12} aria-hidden />
                      {s.productCount} producto{s.productCount !== 1 ? 's' : ''} enlazado
                      {s.productCount !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Link2 size={12} aria-hidden className="shrink-0" />
                      <span className="truncate">
                        Ver todos → {s.ctaHref || HOME_SECTION_DEFAULT_HREF}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={crud.isPending}
                    onClick={() => toggle(s)}
                  >
                    {s.active ? (
                      <>
                        <EyeOff size={13} className="mr-1.5" /> Ocultar
                      </>
                    ) : (
                      <>
                        <Eye size={13} className="mr-1.5" /> Mostrar
                      </>
                    )}
                  </Button>
                  <Button variant="icon" size="sm" title="Editar" onClick={() => crud.openEdit(s)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="icon"
                    size="sm"
                    destructive
                    title="Eliminar"
                    disabled={crud.isPending}
                    onClick={() => crud.openDelete(s)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[12px] text-muted">
          Los productos se enlazan desde la ficha de cada producto, en el bloque &quot;Secciones del
          inicio&quot;. Cada sección muestra hasta 8 productos, del más nuevo al más antiguo.
        </p>
      </div>

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar sección?"
        description={`"${crud.pendingDelete?.title ?? ''}" dejará de mostrarse en el inicio. Los ${crud.pendingDelete?.productCount ?? 0} producto(s) enlazados no se borran: solo pierden el enlace con esta sección.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <HomeSectionDrawer section={crud.editing} isNew={crud.isNew} onClose={crud.closeDrawer} />
      )}
    </div>
  )
}
