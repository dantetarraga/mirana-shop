'use client'

import { listImages, type MediaImage } from '@/features/uploads/actions/media.actions'
import { FOLDER_LABELS, type UploadFolder } from '@/features/uploads/lib/media-folder'
import { MediaImageGrid } from '@/shared/components/admin/MediaImageGrid'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ImagePickerModalProps {
  open: boolean
  onClose: () => void
  folder: UploadFolder
  onSelect: (url: string) => void
}

export function ImagePickerModal({ open, onClose, folder, onSelect }: ImagePickerModalProps) {
  const [scope, setScope] = useState<UploadFolder | 'all'>(folder)
  const [images, setImages] = useState<MediaImage[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setScope(folder)
  }, [open, folder])

  useEffect(() => {
    if (!open) return
    setImages([])
    setCursor(null)
    setLoading(true)
    listImages(scope).then((result) => {
      setLoading(false)
      if (result.success) {
        setImages(result.data.images)
        setCursor(result.data.nextCursor)
      } else {
        toast.error(result.error)
      }
    })
  }, [open, scope])

  const loadMore = async () => {
    if (!cursor) return
    setLoading(true)
    const result = await listImages(scope, cursor)
    setLoading(false)
    if (result.success) {
      setImages((prev) => [...prev, ...result.data.images])
      setCursor(result.data.nextCursor)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Elegir imagen existente" size="xl">
      <div className="flex gap-2 mb-4">
        <Button
          variant={scope === folder ? 'accent' : 'outline'}
          size="sm"
          onClick={() => setScope(folder)}
        >
          {FOLDER_LABELS[folder]}
        </Button>
        <Button variant={scope === 'all' ? 'accent' : 'outline'} size="sm" onClick={() => setScope('all')}>
          Todos
        </Button>
      </div>

      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : (
        <>
          <MediaImageGrid
            images={images}
            onSelect={(img) => {
              onSelect(img.url)
              onClose()
            }}
          />
          {cursor && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                {loading && <Loader2 size={13} className="animate-spin mr-1.5" />}
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
