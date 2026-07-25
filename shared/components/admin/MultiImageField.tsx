'use client'

import { uploadImage } from '@/features/uploads/actions/upload.actions'
import type { UploadFolder } from '@/features/uploads/lib/media-folder'
import {
  ALLOWED_UPLOAD_TYPES,
  describeUploadLimits,
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
} from '@/features/uploads/lib/upload-constraints'
import { ImagePickerModal } from '@/shared/components/admin/ImagePickerModal'
import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Images,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Galería de imágenes del admin: varias de golpe y reordenables.
//
// El orden ES la información: la primera imagen es la principal (la que sale
// en la card del catálogo y como portada de la ficha). Por eso hay tres formas
// de reordenar, no una sola:
//   · arrastrar y soltar — lo natural con ratón
//   · flechas ← →        — teclado y móvil, donde el drag HTML5 no funciona
//   · "hacer principal"  — el caso que de verdad se usa: mandar una al puesto 1
//
// Las imágenes se suben de una en una (con algo de paralelismo) en lugar de en
// una sola petición: el límite de body de las Server Actions cubre un archivo,
// se puede mostrar progreso real, y que una falle no tumba el resto del lote.
// ---------------------------------------------------------------------------

export interface ImageItem {
  url: string
  alt: string
}

interface MultiImageFieldProps {
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
  folder: UploadFolder
  /** Tope de imágenes por entidad. */
  max?: number
}

/** Subidas en vuelo a la vez. Suficiente para ir rápido sin saturar el server. */
const CONCURRENCY = 3

const DEFAULT_MAX = 12

export function MultiImageField({
  images,
  onChange,
  folder,
  max = DEFAULT_MAX,
}: MultiImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [fileDropActive, setFileDropActive] = useState(false)

  const uploading = progress !== null
  const remaining = max - images.length

  // ── Reordenar ──────────────────────────────────────────────────────────

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const update = (i: number, patch: Partial<ImageItem>) => {
    onChange(images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)))
  }

  const remove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i))
  }

  // ── Subida ─────────────────────────────────────────────────────────────

  const uploadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return

    const rejected: string[] = []
    const accepted = fileList.filter((f) => {
      if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(f.type)) {
        rejected.push(`${f.name} (formato no permitido)`)
        return false
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        rejected.push(`${f.name} (supera los ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)`)
        return false
      }
      return true
    })

    if (rejected.length > 0) toast.error(`Sin subir: ${rejected.join(', ')}`)
    if (accepted.length === 0) return

    const batch = accepted.slice(0, Math.max(0, remaining))
    if (batch.length < accepted.length) {
      toast.warning(`Solo caben ${max} imágenes: se omitieron ${accepted.length - batch.length}`)
    }
    if (batch.length === 0) return

    setProgress({ done: 0, total: batch.length })

    // Los resultados se guardan por índice para que las imágenes queden en el
    // mismo orden en que se eligieron, aunque terminen de subir desordenadas.
    const urls: (string | null)[] = new Array(batch.length).fill(null)
    const failed: string[] = []
    let cursor = 0

    const worker = async () => {
      for (;;) {
        const i = cursor++
        if (i >= batch.length) return
        const formData = new FormData()
        formData.append('file', batch[i])
        formData.append('folder', folder)

        const result = await uploadImage(formData)
        if (result.success) urls[i] = result.data.url
        else failed.push(`${batch[i].name}: ${result.error}`)

        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, batch.length) }, () => worker()),
    )

    setProgress(null)

    const uploaded = urls.filter((u): u is string => u !== null)
    if (uploaded.length > 0) {
      onChange([...images, ...uploaded.map((url) => ({ url, alt: '' }))])
      toast.success(`${uploaded.length} imagen${uploaded.length !== 1 ? 'es' : ''} subida${uploaded.length !== 1 ? 's' : ''}`)
    }
    if (failed.length > 0) toast.error(failed.join(' · '))
  }

  // ── Soltar archivos del sistema sobre la zona de subida ────────────────

  const handleFileDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    setFileDropActive(false)
    // Un arrastre interno (reordenar) no trae archivos: se ignora aquí.
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) void uploadFiles(files)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Zona de subida */}
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setFileDropActive(true)
          }
        }}
        onDragLeave={() => setFileDropActive(false)}
        onDrop={handleFileDrop}
        className={cn(
          'border border-dashed px-4 py-5 flex flex-col items-center gap-2.5 text-center transition-colors',
          fileDropActive ? 'border-(--gold) bg-(--gold)/5' : 'border-(--bd)',
        )}
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin text-(--gold)" />
            <div className="text-[13px] text-text">
              Subiendo {progress.done + 1} de {progress.total}…
            </div>
          </>
        ) : (
          <>
            <Upload size={18} className="text-muted" />
            <div className="text-[13px] text-text">
              Arrastra tus imágenes aquí o elige varias a la vez
            </div>
            <div className="text-[11px] text-muted">{describeUploadLimits()}</div>
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              <Button
                type="button"
                variant="accent"
                size="sm"
                disabled={remaining <= 0}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                Subir imágenes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={remaining <= 0}
                onClick={() => setPickerOpen(true)}
              >
                <Images size={14} />
                Biblioteca
              </Button>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            void uploadFiles(files)
          }}
        />
      </div>

      {images.length > 0 && (
        <>
          <p className="text-[11px] text-muted">
            {images.length} de {max} · la primera es la <strong className="text-text">principal</strong>.
            Arrastra para reordenar.
          </p>

          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 list-none p-0 m-0">
            {images.map((img, i) => (
              <li
                key={`${img.url}-${i}`}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i)
                  e.dataTransfer.effectAllowed = 'move'
                  // Firefox exige datos en el dataTransfer para iniciar el drag.
                  e.dataTransfer.setData('text/plain', String(i))
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return
                  e.preventDefault()
                  setOverIndex(i)
                }}
                onDrop={(e) => {
                  if (dragIndex === null) return
                  e.preventDefault()
                  move(dragIndex, i)
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className={cn(
                  'border bg-card flex flex-col transition-colors',
                  dragIndex === i && 'opacity-40',
                  overIndex === i && dragIndex !== i
                    ? 'border-(--gold)'
                    : 'border-(--bd)',
                )}
              >
                <div className="relative aspect-square bg-(--sub)">
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt={img.alt || `Imagen ${i + 1}`}
                      fill
                      className="object-cover pointer-events-none"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  ) : null}

                  {i === 0 && (
                    <span className="absolute top-0 left-0 text-[9px] font-extrabold tracking-[1.5px] uppercase px-2 py-1 bg-(--gold) text-black">
                      Principal
                    </span>
                  )}

                  <span
                    className="absolute top-1 right-1 p-1 text-white/70 cursor-grab"
                    title="Arrastra para reordenar"
                    aria-hidden
                  >
                    <GripVertical size={14} />
                  </span>
                </div>

                <div className="flex items-center border-t border-(--bd)">
                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    disabled={i === 0}
                    aria-label={`Mover imagen ${i + 1} hacia atrás`}
                    onClick={() => move(i, i - 1)}
                  >
                    <ArrowLeft size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    disabled={i === images.length - 1}
                    aria-label={`Mover imagen ${i + 1} hacia adelante`}
                    onClick={() => move(i, i + 1)}
                  >
                    <ArrowRight size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    disabled={i === 0}
                    aria-label={`Hacer principal la imagen ${i + 1}`}
                    title="Hacer principal"
                    onClick={() => move(i, 0)}
                  >
                    <Star size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    destructive
                    className="ml-auto"
                    aria-label={`Eliminar imagen ${i + 1}`}
                    onClick={() => remove(i)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>

                <input
                  value={img.alt}
                  onChange={(e) => update(i, { alt: e.target.value })}
                  className={cn(cls.input, 'text-[11px] py-1.5 border-0 border-t border-(--bd)')}
                  placeholder="Texto alternativo"
                  aria-label={`Texto alternativo de la imagen ${i + 1}`}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <ImagePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        folder={folder}
        onSelect={(url) => onChange([...images, { url, alt: '' }])}
      />
    </div>
  )
}
