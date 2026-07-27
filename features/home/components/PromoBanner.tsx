export function PromoBanner() {
  const items = [
    'Trabajamos con todos los bancos',
    'Hacemos envíos a todo el Perú',
    'Más de 450 figuras vendidas',
    'Coordina tu pago por WhatsApp',
  ]
  const doubled = [...items, ...items]
  return (
    <div className="bg-(--gold) text-black py-2.75 overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-display text-[12px] sm:text-[13px] font-bold tracking-[2px] sm:tracking-[2.5px] uppercase px-4 sm:px-7 inline-flex items-center gap-3.5"
          >
            {item} <span className="opacity-35 text-[9px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
