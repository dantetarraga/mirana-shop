import { TrashClient } from '@/features/trash/components/TrashClient'
import { getTrashCounts, getTrashItems } from '@/features/trash/queries/trash.queries'
import { TRASH_TYPE_LABELS, TRASH_TYPES, type TrashType } from '@/features/trash/types'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { cn } from '@/shared/lib/utils'

function toType(v: string | undefined): TrashType {
  return TRASH_TYPES.includes(v as TrashType) ? (v as TrashType) : 'product'
}

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function TrashPage({ searchParams }: PageProps) {
  const { type: rawType } = await searchParams
  const type = toType(rawType)

  const [counts, items] = await Promise.all([getTrashCounts(), getTrashItems(type)])
  const total = TRASH_TYPES.reduce((sum, t) => sum + counts[t], 0)

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Mantenimiento"
        title={`${total} elemento${total !== 1 ? 's' : ''} en la papelera`}
        align="center"
      />

      <p className="text-[13px] text-muted max-w-2xl mb-4">
        Lo que se elimina desde el admin no desaparece de la base de datos: queda acá, oculto de la
        tienda, hasta que lo restaures o lo borres definitivamente. Algunos elementos no se pueden
        purgar porque hay pedidos o inventario que los referencian.
      </p>

      {/* Tabs por tipo */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {TRASH_TYPES.map((t) => {
          const isActive = t === type
          return (
            <a
              key={t}
              href={`/admin/trash?type=${t}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                isActive
                  ? 'bg-(--gold) border-(--gold) text-black'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {TRASH_TYPE_LABELS[t]} ({counts[t]})
            </a>
          )
        })}
      </div>

      <TrashClient type={type} items={items} />
    </div>
  )
}
