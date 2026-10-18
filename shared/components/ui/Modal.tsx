'use client'

import { Button } from '@/shared/components/ui/Button'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useId } from 'react'
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
  /** Sin cabecera ni padding: el contenido arma su propia estructura
   *  (el modal de acceso, con su franja de marca). Requiere `label`. */
  bare?: boolean
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
  bare = false,
  className,
}: ModalProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(open)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Contador compartido: este modal puede estar anidado dentro de otro diálogo
  // (el ConfirmModal del CartDrawer) y no debe liberar un bloqueo ajeno.
  useScrollLock(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay como <button> fuera del orden de Tab: clic fuera cierra; con
          teclado se cierra con Escape o la X. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-scrim backdrop-blur-[10px] animate-fade-in cursor-default"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title && label ? label : undefined}
        className={cn(
          'relative w-full bg-surf border border-(--bd)',
          'flex flex-col max-h-[calc(100dvh-3rem)] animate-slide-up',
          SIZES[size],
          className,
        )}
      >
        {bare && children}

        {/* Header */}
        {!bare && (label || title || !hideClose) && (
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-0 shrink-0">
            {label && <div className={cn(cls.label, 'mb-1.5')}>{label}</div>}
            {title && (
              <div
                id={titleId}
                className="font-display text-[28px] font-black uppercase tracking-[-0.5px] leading-tight pr-8"
              >
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
                <X size={18} aria-hidden />
              </Button>
            )}
          </div>
        )}

        {/* Body — scrollable */}
        {!bare && children && (
          <div className={cn('flex-1 overflow-y-auto px-5 sm:px-8 pb-6', label || title ? 'pt-6' : 'pt-6 sm:pt-8')}>
            {children}
          </div>
        )}

        {/* Footer */}
        {!bare && footer && <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 shrink-0 flex flex-wrap gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
