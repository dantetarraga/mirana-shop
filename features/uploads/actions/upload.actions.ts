'use server'

import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

const ALLOWED_FOLDERS = ['products', 'brands', 'categories', 'banners', 'cta'] as const
type UploadFolder = (typeof ALLOWED_FOLDERS)[number]

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

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return { success: false, error: 'Formato no permitido (usa JPG, PNG, WEBP o AVIF)', code: 400 }
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'La imagen no puede superar 5MB', code: 400 }
  }

  const filename = `${randomUUID()}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads', folder)

  try {
    await mkdir(dir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, filename), buffer)
  } catch {
    return { success: false, error: 'Error al guardar la imagen en el servidor', code: 500 }
  }

  return { success: true, data: { url: `/uploads/${folder}/${filename}` } }
}
