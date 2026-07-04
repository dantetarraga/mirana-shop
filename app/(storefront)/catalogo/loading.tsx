function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-(--sub) ${className ?? ''}`} />
}

function ProductCardSkeleton() {
  return (
    <div className="border border-(--bd) bg-surf">
      <Bone className="h-55 w-full" />
      <div className="px-4 pt-4 pb-5 flex flex-col gap-3">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-5 w-3/4" />
        <Bone className="h-4 w-1/3" />
        <Bone className="h-9 w-full mt-1" />
      </div>
    </div>
  )
}

export default function CatalogoLoading() {
  return (
    <div className="px-4 sm:px-6 py-10">
      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-7">
        <Bone className="h-10 flex-1 max-w-80" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-9 w-22" />
          ))}
        </div>
      </div>

      {/* Results count */}
      <Bone className="h-3 w-32 mb-6" />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 sm:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
