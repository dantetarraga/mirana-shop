'use client'

import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin-classes'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const SIZES = {
  sm: 'max-w-sm', // 384px  — confirmaciones, alertas
  md: 'max-w-[440px]', // 440px — formularios simples (= AuthModal)
  lg: 'max-w-2xl', // 672px  — formularios complejos
  xl: 'max-w-4xl', // 896px  — tablas, selección múltiple
} as const

type ModalSize = keyof typeof SIZES

export interface ModalProps {
  open: boolean
  onClose: () => void
  label?: string
  title?: string
  description?: string
  size?: ModalSize
  children?: React.ReactNode
  footer?: React.ReactNode
  hideClose?: boolean
  className?: string
}

export function Modal({
  open,
  onClose,
  label,
  title,
  description,
  size = 'md',
  children,
  footer,
  hideClose = false,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    // Overlay
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-300 flex items-center justify-center p-4 sm:p-6
                 bg-black/82 backdrop-blur-[10px] animate-fade-in"
    >
      {/* Panel */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full bg-surf border border-(--bd)',
          'flex flex-col max-h-[calc(100dvh-3rem)] animate-slide-up',
          SIZES[size],
          className,
        )}
      >
        {/* Header */}
        {(label || title || !hideClose) && (
          <div className="px-8 pt-8 pb-0 shrink-0">
            {label && <div className={cn(cls.label, 'mb-1.5')}>{label}</div>}
            {title && (
              <div className="font-display text-[28px] font-black uppercase tracking-[-0.5px] leading-tight pr-8">
                {title}
              </div>
            )}
            {description && (
              <p className="text-muted text-[13px] mt-1.5 font-sans font-normal normal-case tracking-normal">
                {description}
              </p>
            )}
            {!hideClose && (
              <Button
                variant="icon"
                size="md"
                onClick={onClose}
                className="absolute top-4 right-4"
                aria-label="Cerrar"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}

        {/* Body — scrollable */}
        {children && (
          <div className={cn('flex-1 overflow-y-auto px-8 pb-6', label || title ? 'pt-6' : 'pt-8')}>
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && <div className="px-8 pb-8 pt-0 shrink-0 flex gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
