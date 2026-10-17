export function PromoBanner() {
  const items = [
    'Trabajamos con todos los bancos',
    'Hacemos envíos a todo el Perú',
    'Más de 450 figuras vendidas',
    'Coordina tu pago por WhatsApp',
  ]
  const doubled = [...items, ...items]
  return (
    <div className="bg-(--gold) text-on-accent py-2.75 overflow-hidden">
      {/* Marquee solo donde no entra: en desktop los 4 mensajes caben quietos.
          Con la barra de promociones de arriba ya en movimiento, dos tickers a
          la vez en el inicio competían por la atención. */}
      <div className="animate-marquee lg:animate-none lg:justify-center flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length || undefined}
            className={`font-display text-[12px] sm:text-[13px] font-bold tracking-[2px] sm:tracking-[2.5px] uppercase px-4 sm:px-7 inline-flex items-center gap-3.5 ${
              i >= items.length ? 'lg:hidden' : ''
            }`}
          >
            {item} <span aria-hidden className="opacity-35 text-[9px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
