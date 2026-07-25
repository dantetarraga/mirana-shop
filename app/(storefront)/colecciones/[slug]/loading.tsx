function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-(--sub) ${className ?? ''}`} />
}

export default function CollectionDetailLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-360 mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-10">
        <Bone className="h-2.5 w-10" />
        <Bone className="h-2.5 w-2.5" />
        <Bone className="h-2.5 w-16" />
        <Bone className="h-2.5 w-2.5" />
        <Bone className="h-2.5 w-40" />
      </div>

      {/* Cabecera */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-8 lg:gap-12 items-start mb-12">
        <Bone className="aspect-square w-full" />
        <div className="flex flex-col gap-6 pt-2">
          <Bone className="h-2.5 w-44" />
          <div className="flex flex-col gap-2">
            <Bone className="h-12 w-full" />
            <Bone className="h-12 w-2/3" />
          </div>
          <Bone className="h-14 w-52" />
          <div className="flex flex-col gap-2.5">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
          </div>
          <Bone className="h-11 w-56" />
        </div>
      </div>

      {/* Grid de productos */}
      <Bone className="h-7 w-72 mb-5" />
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-96 w-full" />
        ))}
      </div>
    </div>
  )
}
