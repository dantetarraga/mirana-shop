function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-(--sub) ${className ?? ''}`} />
}

export default function ProductDetailLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-360 mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-10">
        <Bone className="h-2.5 w-10" />
        <Bone className="h-2.5 w-2.5" />
        <Bone className="h-2.5 w-16" />
        <Bone className="h-2.5 w-2.5" />
        <Bone className="h-2.5 w-24" />
        <Bone className="h-2.5 w-2.5" />
        <Bone className="h-2.5 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Left — image */}
        <Bone className="aspect-square w-full" />

        {/* Right — info */}
        <div className="flex flex-col gap-6 pt-2">
          <Bone className="h-2.5 w-32" />
          <div className="flex flex-col gap-2">
            <Bone className="h-12 w-full" />
            <Bone className="h-12 w-3/4" />
          </div>
          <Bone className="h-2.5 w-20" />
          <Bone className="h-14 w-40" />
          <div className="flex flex-col gap-2.5">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
            <Bone className="h-3 w-4/5" />
          </div>
          <div className="mt-2 flex flex-col gap-3">
            <Bone className="h-2.5 w-20" />
            <Bone className="h-11 w-36" />
          </div>
          <Bone className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
