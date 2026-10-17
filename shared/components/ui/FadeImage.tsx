'use client'

import { cn } from '@/shared/lib/utils'
import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

/**
 * next/image que entra con un fundido de opacidad al terminar de cargar, en
 * vez de aparecer de golpe línea por línea. El contenedor debe pintar el
 * placeholder (las clases `.stripe-*` o `bg-skeleton`), así nunca se ve un
 * hueco blanco mientras llega la foto. Sin blur: con figuras sobre fondo plano
 * el desenfoque se lee como imagen rota.
 *
 * next/image llama a `onLoad` también si la imagen ya estaba en caché antes de
 * hidratar (revisa `img.complete`), así que no queda invisible.
 * Con prefers-reduced-motion la transición se anula globalmente.
 */
export function FadeImage({ className, onLoad, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      {...props}
      alt={alt}
      data-loaded={loaded}
      className={cn('img-fade', className)}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
    />
  )
}
