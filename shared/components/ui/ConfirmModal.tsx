'use client'

import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'

interface ConfirmModalProps {
  open:           boolean
  onClose:        () => void
  onConfirm:      () => void
  title:          string
  description?:   string
  confirmLabel?:  string
  cancelLabel?:   string
  isPending?:     boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel  = 'Cancelar',
  isPending    = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
    >
      <div className="flex flex-col gap-2.5 mt-2">
        <Button
          variant="accent"
          size="md"
          full
          disabled={isPending}
          onClick={onConfirm}
          className="bg-[#ff6644] hover:bg-[#ff4422] text-white border-transparent"
        >
          {isPending ? 'Eliminando...' : confirmLabel}
        </Button>
        <Button variant="outline" size="md" full onClick={onClose} disabled={isPending}>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  )
}
