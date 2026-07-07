'use server'

import { ALLOWED_FOLDERS, withAutoFormat, type UploadFolder } from '@/features/uploads/lib/media-folder'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { v2 as cloudinary } from 'cloudinary'

// Config se toma automáticamente de la env var CLOUDINARY_URL (formato del dashboard de Cloudinary)

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export async function uploadImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const file = formData.get('file')
  const folder = formData.get('folder')

  if (!(file instanceof File)) {
    return { success: false, error: 'Archivo inválido', code: 400 }
  }
  if (typeof folder !== 'string' || !ALLOWED_FOLDERS.includes(folder as UploadFolder)) {
    return { success: false, error: 'Destino de subida inválido', code: 400 }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Formato no permitido (usa JPG, PNG, WEBP o AVIF)', code: 400 }
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'La imagen no puede superar 5MB', code: 400 }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `mirana/${folder}` }, (error, uploadResult) => {
          if (error || !uploadResult) reject(error ?? new Error('Sin respuesta de Cloudinary'))
          else resolve(uploadResult)
        })
        .end(buffer)
    })

    return { success: true, data: { url: withAutoFormat(result.secure_url) } }
  } catch {
    return { success: false, error: 'Error al subir la imagen', code: 500 }
  }
}
