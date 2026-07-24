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
  return (
    <Modal open={open} onClose={onClose} title="Elegir imagen existente" size="xl">
      {/* El cuerpo es hijo del Modal: se monta fresco en cada apertura (Modal
          devuelve null al cerrar), así el scope vuelve a `folder` sin refs. */}
      <PickerBody folder={folder} onSelect={onSelect} onClose={onClose} />
    </Modal>
  )
}

function PickerBody({
  folder,
  onSelect,
  onClose,
}: {
  folder: UploadFolder
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [scope, setScope] = useState<UploadFolder | 'all'>(folder)
  // Estado derivado (ver MediaLibraryClient): `loaded.scope` indica a qué scope
  // pertenece el contenido; mientras no coincida con `scope`, se derivan
  // loading/lista vacía sin setState síncrono en el efecto.
  const [loaded, setLoaded] = useState<{
    scope: UploadFolder | 'all' | null
    images: MediaImage[]
    cursor: string | null
  }>({ scope: null, images: [], cursor: null })
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    listImages(scope).then((result) => {
      if (cancelled) return
      if (result.success) {
        setLoaded({ scope, images: result.data.images, cursor: result.data.nextCursor })
      } else {
        setLoaded({ scope, images: [], cursor: null })
        toast.error(result.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [scope])

  const isCurrent = loaded.scope === scope
  const images = isCurrent ? loaded.images : []
  const cursor = isCurrent ? loaded.cursor : null
  const loading = !isCurrent

  const loadMore = async () => {
    if (!cursor) return
    setLoadingMore(true)
    const result = await listImages(scope, cursor)
    setLoadingMore(false)
    if (result.success) {
      setLoaded((prev) => ({
        scope,
        images: [...prev.images, ...result.data.images],
        cursor: result.data.nextCursor,
      }))
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
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
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 size={13} className="animate-spin mr-1.5" />}
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
