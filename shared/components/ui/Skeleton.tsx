import { cn } from '@/shared/lib/utils'
import type { CSSProperties, ElementType, ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Primitivas de carga — la ÚNICA forma de dibujar un placeholder en el sitio.
//
// <Skeleton>       un bloque. Siempre aria-hidden: es decoración; lo que se
//                  anuncia al lector de pantalla lo dice <SkeletonRegion>.
// <SkeletonRegion> el contenedor de un esqueleto completo. role="status" +
//                  aria-busy + una etiqueta sr-only ("Cargando catálogo…").
//                  Un esqueleto sin región es mudo para un lector de pantalla;
//                  una región por pantalla — no anidar.
//
// El brillo (.skeleton en globals.css) desaparece con prefers-reduced-motion.
// Para no saltar al llegar el contenido, copiar del componente real las mismas
// clases de layout (grid, aspect-ratio, alturas) en vez de inventar medidas.
// ---------------------------------------------------------------------------

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div aria-hidden className={cn('skeleton', className)} style={style} />
}

interface SkeletonRegionProps {
  /** Lo que lee el lector de pantalla: "Cargando pedidos…" */
  label: string
  className?: string
  children: ReactNode
  as?: ElementType
}

export function SkeletonRegion({ label, className, children, as: Tag = 'div' }: SkeletonRegionProps) {
  return (
    <Tag role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </Tag>
  )
}
