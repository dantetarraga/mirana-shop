import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'

interface Props {
  title: string
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
