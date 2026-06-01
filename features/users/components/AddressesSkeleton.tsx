import { Skeleton } from '@/shared/components/ui/Skeleton'

export function AddressesSkeleton() {
  return (
    <div className="max-w-200 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="w-12 h-3 mb-2" />
          <Skeleton className="w-48 h-8" />
        </div>
        <Skeleton className="w-36 h-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-(--bd) p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-1.5">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="w-6 h-6" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
