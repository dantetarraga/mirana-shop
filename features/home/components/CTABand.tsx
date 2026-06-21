import { Button } from '@/shared/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function CTABand() {
  return (
    <div className="shell-m mb-20 bg-(--gold) shell py-12 flex items-center justify-between gap-6 [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]">
      <div>
        <h2 className="font-display font-black uppercase text-black leading-[0.95] tracking-[-1px] text-[clamp(28px,4vw,54px)]">
          Ediciones
          <br />
          Limitadas
        </h2>
        <p className="text-black/55 text-[14px] mt-2">
          Piezas por tiempo limitado — no te quedes sin las tuyas
        </p>
      </div>
      <Button variant="dark" size="lg" className="whitespace-nowrap shrink-0">
        Explorar ahora
        <ArrowRight size={14} className="ml-1" strokeWidth={3} />
      </Button>
    </div>
  )
}
