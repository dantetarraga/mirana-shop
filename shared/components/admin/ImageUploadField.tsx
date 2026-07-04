'use client'

import { uploadImage } from '@/features/uploads/actions/upload.actions'
import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn } from '@/shared/lib/utils'
import { Loader2, Upload } from 'lucide-react'
import { useRef, useTransition, type ChangeEvent } from 'react'
import { toast } from 'sonner'

type UploadFolder = 'products' | 'brands' | 'categories' | 'banners'

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
    <div className={cn('flex gap-2', className)}>
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
    </div>
  )
}
