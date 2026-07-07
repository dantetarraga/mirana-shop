'use client'

import type { MediaImage } from '@/features/uploads/actions/media.actions'
import { Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface MediaImageGridProps {
  images: MediaImage[]
  onSelect?: (image: MediaImage) => void
  onDelete?: (image: MediaImage) => void
  deletingId?: string | null
}

export function MediaImageGrid({ images, onSelect, onDelete, deletingId }: MediaImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-[13px]">Sin imágenes en esta carpeta.</div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {images.map((img) => (
        <div
          key={img.publicId}
          className="group relative aspect-square border border-(--bd) bg-surf overflow-hidden"
        >
          <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />

          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(img)}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <span className="text-[11px] font-display font-bold uppercase tracking-wide text-white">
                Usar
              </span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(img)}
              disabled={deletingId === img.publicId}
              className="absolute top-1.5 right-1.5 p-1.5 bg-black/70 text-white hover:bg-red-500/90 transition-colors disabled:opacity-50"
              title="Eliminar"
            >
              {deletingId === img.publicId ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
