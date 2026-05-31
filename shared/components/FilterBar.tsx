'use client'

import { Button } from '@/shared/components/ui/Button'
import { Search } from 'lucide-react'
import React from 'react'

export interface FilterTab {
  key: string
  label: string
  count?: number
}

interface FilterBarProps {
  query: string
  placeholder?: string
  activeTab: string
  tabs: FilterTab[]
  onQuery: (q: string) => void
  onTab: (key: string) => void
  actions?: React.ReactNode
}

export function FilterBar({
  query,
  placeholder = 'Buscar...',
  activeTab,
  tabs,
  onQuery,
  onTab,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-3.5 mb-4.5 flex-wrap">
      <div className="flex items-center gap-2.25 px-3.5 h-10.5 flex-1 min-w-50 max-w-85 bg-card border border-(--bd)">
        <Search size={13} className="text-muted" />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full font-sans text-text"
        />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant="tab"
            size="sm"
            active={activeTab === t.key}
            onClick={() => onTab(t.key)}
          >
            {t.label}
            {t.count != null && <span className="text-[12px] opacity-70 ml-1">{t.count}</span>}
          </Button>
        ))}
      </div>
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  )
}
