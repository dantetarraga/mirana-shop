import { Skeleton } from '@/shared/components/ui/Skeleton'

/**
 * Hueco de la zona de compra mientras el carrito del servidor todavía no llegó
 * (`ctaState === 'loading'`).
 *
 * El carrito se siembra en un efecto, así que el primer pintado no sabe si el
 * producto ya está agregado. Afirmar "Agregar al carrito" y corregirlo después
 * produce un salto azul → verde en cada recarga; este placeholder reserva el
 * mismo espacio y deja que los controles aterricen directo en su estado final.
 *
 * Sin role="status": vive dentro de cada card de un grid y anunciar "cargando"
 * 24 veces no ayuda a nadie. Es decoración: aria-hidden.
 */

interface Props {
  /** Igual que el `size` del botón al que reemplaza. */
  size?: 'md' | 'lg'
  /** Reserva también el selector de cantidad (PDP y modal). */
  withQuantity?: boolean
}

export function CartCtaSkeleton({ size = 'lg', withQuantity = false }: Props) {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {withQuantity && (
        <div>
          {/* Etiqueta "Cantidad" */}
          <Skeleton className="h-3 w-16 mb-2.5" />
          {/* Alto y ancho del stepper real: dos botones icon md (44px) + el
              valor (w-13 = 52px) + los bordes = 142px de ancho, 44px de alto. */}
          <Skeleton className="h-11 w-35.5" />
        </div>
      )}

      {/* Se reutilizan las clases del botón real en vez de fijar una altura a
          mano: así el padding y el tamaño de fuente son los mismos y el bloque
          no cambia de alto cuando se resuelve la carga. */}
      <div className={`ui-btn ui-btn--${size} ui-btn--full skeleton`}>&nbsp;</div>
    </div>
  )
}
