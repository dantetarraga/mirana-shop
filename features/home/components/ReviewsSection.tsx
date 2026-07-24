import { StarRating } from '@/shared/components/ui/StarRating'

const REVIEWS = [
  {
    name: 'Carlos M.',
    role: 'Coleccionista · 3 años',
    initials: 'CM',
    stars: 5,
    text: 'La calidad de las figuras es absurda. Pedí el Iron Man Hall of Armor y llegó con un empaque que da miedo abrir. Es mi tienda fija.',
  },
  {
    name: 'Andrea R.',
    role: 'Cliente nuevo',
    initials: 'AR',
    stars: 5,
    text: 'Compré el LEGO Millennium Falcon como regalo y el unboxing fue una experiencia. Envío en 48h y todo perfecto.',
  },
  {
    name: 'Diego F.',
    role: 'Coleccionista · 5 años',
    initials: 'DF',
    stars: 5,
    text: 'Llevo más de 20 piezas compradas. Las ediciones limitadas se agotan rápido pero el equipo siempre responde por WhatsApp.',
  },
  {
    name: 'María L.',
    role: 'Cliente recurrente',
    initials: 'ML',
    stars: 4,
    text: 'Excelente catálogo de figuras de anime. El Goku Ultra Instinct superó mis expectativas — la pintura es de otro nivel.',
  },
  {
    name: 'José T.',
    role: 'Padre coleccionista',
    initials: 'JT',
    stars: 5,
    text: 'Mi hijo y yo compramos juntos cada mes. El servicio es impecable y los precios son justos para la calidad premium.',
  },
  {
    name: 'Sofía P.',
    role: 'Coleccionista · 2 años',
    initials: 'SP',
    stars: 5,
    text: 'La curaduría de productos es lo mejor — no encuentras este nivel en otra tienda online en español. Recomendado 100%.',
  },
]

export function ReviewsSection() {
  return (
    <section className="glow-section shell py-14 md:py-20">
      <div className="relative z-1 flex justify-between items-start mb-8 md:mb-10">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-(--gold) mb-2.5">
            Testimonios
          </div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,5vw,64px)]">
            Lo que dicen
            <br />
            nuestros coleccionistas
          </h2>
          <div className="flex items-center gap-3.5 mt-4.5">
            <span className="font-display text-[48px] font-black text-(--gold) leading-none">
              4.9
            </span>
            <div>
              <StarRating value={5} size={14} className="text-(--gold)" />
              <div className="text-[11px] text-muted tracking-[1px] uppercase mt-1">
                Basado en 2,847 reseñas
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REVIEWS.map((r, i) => (
          <div
            key={i}
            className="animate-fade-up bg-card border border-(--bd) p-6 sm:p-7 relative transition-[border-color] duration-[.25s]"
          >
            <div className="absolute top-3.5 right-4.5 font-display text-[72px] font-black text-(--gold) opacity-[.15] leading-[0.8] italic">
              &ldquo;
            </div>
            <div className="text-(--gold) mb-3.5">
              <StarRating value={r.stars} size={13} />
            </div>
            <p className="text-[14px] leading-[1.7] text-text mb-5 font-light min-h-21">{r.text}</p>
            <div className="flex items-center gap-3 pt-4.5 border-t border-(--bd)">
              <div className="w-10.5 h-10.5 rounded-full bg-(--gold) text-black flex items-center justify-center font-display font-black text-[16px]">
                {r.initials}
              </div>
              <div>
                <div className="font-display text-[16px] font-extrabold uppercase tracking-[0.5px]">
                  {r.name}
                </div>
                <div className="text-[11px] text-muted tracking-[1px] uppercase">{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
