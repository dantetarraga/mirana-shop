import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'

interface Props {
  label: string
  title: React.ReactNode
  side?: React.ReactNode
  mb?: string
  align?: 'start' | 'center'
}

export function PanelHeader({ label, title, side, mb = 'mb-4.5', align = 'start' }: Props) {
  return (
    <div
      className={cn(
        'flex justify-between',
        align === 'center' ? 'items-center' : 'items-start',
        mb,
      )}
    >
      <div>
        <div className={cls.label}>{label}</div>
        <div className={cls.title}>{title}</div>
      </div>
      {side}
    </div>
  )
}
