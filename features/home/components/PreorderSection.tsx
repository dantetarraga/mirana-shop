import { Button } from "@/shared/components/ui/Button";

export function PreorderSection() {
  return (
    <section className="px-12 py-20">
      <div className="mb-8">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-[var(--gold)] mb-2.5">Disponibles pronto</div>
        <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)]">Preventas</h2>
        <div className="text-[14px] text-muted mt-2">Reserva con adelanto del 50% y asegura tu pieza</div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {[
          { name: "Goku Black Super Saiyan Rosé", arrival: "Ago 2026", cat: "stripe-fig", price: 89.99, badge: "PREVENTA" },
          { name: "LEGO Technic Ferrari SF-24", arrival: "Sep 2026", cat: "stripe-lego", price: 249.99, badge: "PREVENTA" },
          { name: "Lamborghini Countach 1:18", arrival: "Jul 2026", cat: "stripe-veh", price: 119.99, badge: "PREVENTA" },
        ].map((p) => (
          <div key={p.name} className="bg-card border border-[var(--bd)] cursor-pointer">
            <div className={`${p.cat} h-[200px] relative flex items-center justify-center`}>
              <div className="absolute top-3 left-0 bg-[var(--gold)] text-black text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-[5px]">{p.badge}</div>
              <span className="font-mono text-[10px] tracking-[2px] text-muted uppercase">preventa</span>
            </div>
            <div className="p-5">
              <div className="font-display text-[20px] font-black uppercase tracking-[-0.3px] mb-2">{p.name}</div>
              <div className="flex justify-between items-center mb-4">
                <div className="font-display text-[24px] font-black text-[var(--gold)]">${p.price.toFixed(2)}</div>
                <div className="text-[11px] text-muted border border-[var(--bd)] px-2.5 py-1 tracking-[1px] uppercase">
                  Llegada {p.arrival}
                </div>
              </div>
              <Button variant="outline" size="sm" full>
                Reservar ahora
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
