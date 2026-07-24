'use client'

import { Button } from '@/shared/components/ui/Button'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { cls } from '@/shared/lib/admin/admin-classes'
import { X } from 'lucide-react'
import React, { useEffect, useId } from 'react'

interface AdminDrawerProps {
  title: string
  sub?: string
  onClose: () => void
  children: React.ReactNode
}

export function AdminDrawer({ title, sub, onClose, children }: AdminDrawerProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true)
  const titleId = useId()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex justify-end"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-110 max-w-full h-screen overflow-y-auto bg-surf border-l border-(--bd)"
      >
        <div className="px-7 py-6 flex justify-between items-start sticky top-0 z-5 bg-surf border-b border-(--bd)">
          <div>
            {sub && <div className={cls.label}>{sub}</div>}
            <div id={titleId} className="font-display text-[26px] font-black tracking-[-0.5px]">
              {title}
            </div>
          </div>
          <Button variant="icon" size="md" aria-label="Cerrar" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className="px-7 pt-6 pb-10 flex flex-col gap-4.5">{children}</div>
      </div>
    </div>
  )
}
