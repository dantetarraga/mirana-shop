'use client'

import { uploadImage } from '@/features/uploads/actions/upload.actions'
import type { UploadFolder } from '@/features/uploads/lib/media-folder'
import { ImagePickerModal } from '@/shared/components/admin/ImagePickerModal'
import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { ImageOff, Images, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { toast } from 'sonner'

interface ImageUploadFieldProps {
  value: string
  onChange: (url: string) => void
  folder: UploadFolder
  placeholder?: string
  className?: string
}

export function ImageUploadField({
  value,
  onChange,
  folder,
  placeholder = 'https://...',
  className,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [pickerOpen, setPickerOpen] = useState(false)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const result = await uploadImage(formData)
      if (result.success) {
        onChange(result.data.url)
        toast.success('Imagen subida')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className={cn('flex gap-2 items-start', className)}>
      <div className="w-11 h-11 shrink-0 border border-(--bd) bg-surf relative overflow-hidden flex items-center justify-center">
        {isPending ? (
          <Loader2 size={16} className="animate-spin text-muted" />
        ) : value ? (
          <Image src={value} alt="Vista previa" fill className="object-cover" sizes="44px" />
        ) : (
          <ImageOff size={16} className="text-muted" />
        )}
      </div>

      <div className="flex gap-2 flex-1 min-w-0">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls.input}
          placeholder={placeholder}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Subir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setPickerOpen(true)}
          className="shrink-0"
          title="Elegir imagen existente"
        >
          <Images size={14} />
        </Button>
      </div>

      <ImagePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        folder={folder}
        onSelect={onChange}
      />
    </div>
  )
}
