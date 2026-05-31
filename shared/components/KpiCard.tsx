import { cls } from '@/shared/lib/admin-classes'
import { cn } from '@/shared/lib/utils'
import React from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  valueClass?: string
  children?: React.ReactNode
}

export function KpiCard({ label, value, valueClass = 'text-text', children }: KpiCardProps) {
  return (
    <div className={cls.kpi}>
      <div className={cn(cls.label, 'mb-2')}>{label}</div>
      <div
        className={cn(
          'font-display text-[36px] font-black leading-none tracking-[-1px]',
          valueClass,
        )}
      >
        {value}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
