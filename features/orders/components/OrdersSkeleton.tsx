import { Skeleton } from '@/shared/components/ui/Skeleton'

export function OrdersSkeleton() {
  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      <div className="mb-8">
        <Skeleton className="w-12 h-3 mb-2" />
        <Skeleton className="w-40 h-8" />
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-(--bd) px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-6 gap-y-2 items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
