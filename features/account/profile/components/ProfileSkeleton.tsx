import { Skeleton } from '@/shared/components/ui/Skeleton'

export function ProfileSkeleton() {
  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="w-12 h-3 mb-2" />
        <Skeleton className="w-48 h-8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="bg-card border border-(--bd) p-6 flex items-center gap-5">
            <Skeleton className="w-16 h-16 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Data card */}
          <div className="bg-card border border-(--bd) p-6 flex flex-col gap-4">
            <Skeleton className="h-3 w-28" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-(--bd) p-4 flex flex-col gap-2.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-14" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
