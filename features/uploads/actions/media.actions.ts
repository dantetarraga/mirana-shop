'use server'

import {
  ALLOWED_FOLDERS,
  withAutoFormat,
  type UploadFolder,
} from '@/features/uploads/lib/media-folder'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { v2 as cloudinary, type ResourceApiResponse } from 'cloudinary'

const PAGE_SIZE = 30

export interface MediaImage {
  publicId: string
  url: string
  width: number
  height: number
  bytes: number
  createdAt: string
}

export async function listImages(
  folder: UploadFolder | 'all',
  cursor?: string,
): Promise<ActionResult<{ images: MediaImage[]; nextCursor: string | null }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (folder !== 'all' && !ALLOWED_FOLDERS.includes(folder)) {
    return { success: false, error: 'Carpeta inválida', code: 400 }
  }

  try {
    const result: ResourceApiResponse = await cloudinary.api.resources({
      type: 'upload',
      ...(folder !== 'all' && { prefix: `mirana/${folder}/` }),
      max_results: PAGE_SIZE,
      next_cursor: cursor,
    })

    const images: MediaImage[] = result.resources.map((r) => ({
      publicId: r.public_id,
      url: withAutoFormat(r.secure_url),
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      createdAt: r.created_at,
    }))

    return { success: true, data: { images, nextCursor: result.next_cursor ?? null } }
  } catch {
    return { success: false, error: 'Error al cargar imágenes de Cloudinary', code: 500 }
  }
}

export async function deleteImage(publicId: string): Promise<ActionResult<null>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    await cloudinary.uploader.destroy(publicId)
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Error al eliminar la imagen', code: 500 }
  }
}
