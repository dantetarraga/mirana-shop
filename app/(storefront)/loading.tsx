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

function SectionHeader({ wide }: { wide?: boolean }) {
  return (
    <div className="flex flex-col gap-2 mb-7">
      <Bone className={`h-2.5 ${wide ? 'w-28' : 'w-20'}`} />
      <Bone className="h-8 w-72" />
    </div>
  )
}

export default function StorefrontLoading() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <Bone className="w-full h-screen" />

      {/* Promo strip */}
      <Bone className="w-full h-12" />

      {/* New Arrivals */}
      <section className="px-6 py-16">
        <SectionHeader />
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-64">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-6 pb-16">
        <SectionHeader wide />
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* CTA Band */}
      <Bone className="w-full h-32" />

      {/* Category Strips */}
      <section className="px-6 py-16">
        <SectionHeader />
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-60 w-full" />
          ))}
        </div>
      </section>

      {/* Preorder Section */}
      <section className="px-6 pb-16">
        <SectionHeader />
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Brands strip */}
      <Bone className="w-full h-20" />
    </div>
  )
}
