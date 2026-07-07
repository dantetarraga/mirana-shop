'use client'

import { deleteImage, listImages, type MediaImage } from '@/features/uploads/actions/media.actions'
import { ALLOWED_FOLDERS, FOLDER_LABELS } from '@/features/uploads/lib/media-folder'
import { MediaImageGrid } from '@/shared/components/admin/MediaImageGrid'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const TABS = ['all', ...ALLOWED_FOLDERS] as const

export function MediaLibraryClient() {
  const [folder, setFolder] = useState<(typeof TABS)[number]>('all')
  const [images, setImages] = useState<MediaImage[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<MediaImage | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setImages([])
    setCursor(null)
    listImages(folder).then((result) => {
      setLoading(false)
      if (result.success) {
        setImages(result.data.images)
        setCursor(result.data.nextCursor)
      } else {
        toast.error(result.error)
      }
    })
  }, [folder])

  const loadMore = async () => {
    if (!cursor) return
    setLoading(true)
    const result = await listImages(folder, cursor)
    setLoading(false)
    if (result.success) {
      setImages((prev) => [...prev, ...result.data.images])
      setCursor(result.data.nextCursor)
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const result = await deleteImage(pendingDelete.publicId)
    setDeleting(false)
    if (result.success) {
      setImages((prev) => prev.filter((i) => i.publicId !== pendingDelete.publicId))
      toast.success('Imagen eliminada')
      setPendingDelete(null)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader label="Contenido" title="Imágenes" align="center" />

      <div className="flex gap-2 flex-wrap mb-5">
        {TABS.map((f) => (
          <Button
            key={f}
            variant={f === folder ? 'accent' : 'outline'}
            size="sm"
            onClick={() => setFolder(f)}
          >
            {f === 'all' ? 'Todos' : FOLDER_LABELS[f]}
          </Button>
        ))}
      </div>

      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : (
        <>
          <MediaImageGrid
            images={images}
            onDelete={setPendingDelete}
            deletingId={deleting ? (pendingDelete?.publicId ?? null) : null}
          />
          {cursor && (
            <div className="flex justify-center mt-5">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                {loading && <Loader2 size={13} className="animate-spin mr-1.5" />}
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar imagen?"
        description="Se eliminará permanentemente de Cloudinary. Si está en uso por algún producto, banner, etc., dejará de mostrarse ahí."
        isPending={deleting}
      />
    </div>
  )
}
