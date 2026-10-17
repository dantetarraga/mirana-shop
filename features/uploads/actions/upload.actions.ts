'use server'

import { ALLOWED_FOLDERS, withAutoFormat, type UploadFolder } from '@/features/uploads/lib/media-folder'
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/features/uploads/lib/upload-constraints'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { v2 as cloudinary } from 'cloudinary'

// Config se toma automáticamente de la env var CLOUDINARY_URL (formato del dashboard de Cloudinary)

const MAX_SIZE = MAX_UPLOAD_BYTES

const ALLOWED_TYPES: readonly string[] = ALLOWED_UPLOAD_TYPES

type ImageFormat = 'png' | 'jpg' | 'webp' | 'gif' | 'avif'

/** Formatos que Cloudinary acepta en la subida (allowed_formats). */
const CLOUDINARY_FORMATS: ImageFormat[] = ['png', 'jpg', 'webp', 'gif', 'avif']

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  return bytes.every((b, i) => buf[offset + i] === b)
}

/**
 * Formato real por magic bytes. El MIME de `File.type` lo declara el cliente
 * (cualquiera puede mandar un SVG con `image/png`), así que no sirve para
 * bloquear SVG/HTML: un SVG con <script> servido desde el dominio de
 * Cloudinary es XSS almacenado. Lo que no sea un raster conocido se rechaza.
 */
function detectImageFormat(buf: Buffer): ImageFormat | null {
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpg'
  // RIFF....WEBP
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'webp'
  }
  // GIF87a / GIF89a
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38]) && (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61) {
    return 'gif'
  }
  // ISO-BMFF: ....ftyp + marca avif/avis
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = buf.toString('ascii', 8, 12)
    if (brand === 'avif' || brand === 'avis') return 'avif'
  }
  return null
}

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
    if (!detectImageFormat(buffer)) {
      return { success: false, error: 'Formato no permitido (usa JPG, PNG, WEBP o AVIF)', code: 400 }
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          // allowed_formats: segunda barrera del lado de Cloudinary, por si el
          // archivo engaña a la detección local.
          { folder: `mirana/${folder}`, resource_type: 'image', allowed_formats: CLOUDINARY_FORMATS },
          (error, uploadResult) => {
            if (error || !uploadResult) reject(error ?? new Error('Sin respuesta de Cloudinary'))
            else resolve(uploadResult)
          },
        )
        .end(buffer)
    })

    return { success: true, data: { url: withAutoFormat(result.secure_url) } }
  } catch {
    return { success: false, error: 'Error al subir la imagen', code: 500 }
  }
}
