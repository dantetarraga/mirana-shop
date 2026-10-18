import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

/** ↔ LegalPageView: shell pt-9, columna max-w-175, eyebrow + h1 + fecha + prosa. */
export function LegalPageSkeleton() {
  return (
    <SkeletonRegion label="Cargando página…" as="section" className="shell pb-20 pt-9">
      <div className="max-w-175 mx-auto">
        <div className="text-[10px] mb-1.5">
          <Skeleton className="inline-block align-middle h-[1em] w-20" />
        </div>
        <div className="font-display leading-[0.95] text-[clamp(30px,4vw,48px)] mb-2">
          <Skeleton className="inline-block align-middle h-[0.8em] w-[min(26rem,85%)]" />
        </div>
        <div className="text-[12px] mb-8">
          <Skeleton className="inline-block align-middle h-[1em] w-36" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className={`h-3.5 ${i % 4 === 3 ? 'w-2/3 mb-4' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  )
}
