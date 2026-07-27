import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'

interface Props {
  /** Nodo y no `string` para poder colgarle un InfoTooltip al lado. */
  title: React.ReactNode
  children: React.ReactNode
  divider?: boolean
}

export function DrawerSection({ title, children, divider = true }: Props) {
  return (
    <div className={cn(divider && 'pt-4.5 border-t border-(--bd)')}>
      <div className={cn(cls.label, 'mb-2.5')}>{title}</div>
      {children}
    </div>
  )
}
