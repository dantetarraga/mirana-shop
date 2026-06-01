function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-(--sub) ${className ?? ''}`} style={style} />
}

export default function Loading() {
  return (
    <div className="px-8 pt-7 pb-12">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-(--bd) p-[20px_22px]">
            <Bone className="h-2.5 w-20 mb-3 rounded-sm" />
            <Bone className="h-7 w-28 mb-3 rounded-sm" />
            <Bone className="h-2.5 w-32 mb-4 rounded-sm" />
            <Bone className="h-10 w-full rounded-sm" />
          </div>
        ))}
      </div>

      {/* Área chart + Donut */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="flex justify-between items-start mb-5">
            <div>
              <Bone className="h-2.5 w-16 mb-2 rounded-sm" />
              <Bone className="h-6 w-48 rounded-sm" />
            </div>
            <Bone className="h-8 w-20 rounded-sm" />
          </div>
          <Bone className="w-full h-65 rounded-sm" />
        </div>
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="mb-5">
            <Bone className="h-2.5 w-20 mb-2 rounded-sm" />
            <Bone className="h-6 w-40 rounded-sm" />
          </div>
          <div className="flex justify-center mb-4">
            <Bone className="w-45 h-45 rounded-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-3">
              <Bone className="w-2.5 h-2.5 rounded-full shrink-0" />
              <Bone className="h-3 flex-1 rounded-sm" />
              <Bone className="h-4 w-8 rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Barras + Top productos */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="flex justify-between items-start mb-5">
            <div>
              <Bone className="h-2.5 w-24 mb-2 rounded-sm" />
              <Bone className="h-6 w-52 rounded-sm" />
            </div>
            <Bone className="h-8 w-12 rounded-sm" />
          </div>
          <Bone className="w-full h-45 rounded-sm" />
        </div>
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="flex justify-between items-center mb-5">
            <div>
              <Bone className="h-2.5 w-20 mb-2 rounded-sm" />
              <Bone className="h-6 w-32 rounded-sm" />
            </div>
            <Bone className="h-3.5 w-16 rounded-sm" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 mb-4">
              <Bone className="w-4.5 h-5 rounded-sm shrink-0" />
              <Bone className="w-10 h-10 shrink-0 rounded-sm" />
              <div className="flex-1 min-w-0">
                <Bone className="h-3.5 w-full mb-2 rounded-sm" style={{ opacity: 1 - i * 0.12 }} />
                <Bone className="h-1.5 w-full rounded-sm" style={{ opacity: 1 - i * 0.12 }} />
              </div>
              <Bone className="w-8 h-5 rounded-sm shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de pedidos recientes */}
      <div className="border border-(--bd) overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-(--bd)">
          <div>
            <Bone className="h-2.5 w-28 mb-2 rounded-sm" />
            <Bone className="h-6 w-36 rounded-sm" />
          </div>
          <Bone className="h-3.5 w-20 rounded-sm" />
        </div>
        <div className="bg-surf border-b border-(--bd) flex gap-4 px-4 py-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-2.5 flex-1 rounded-sm" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-b border-(--bd) last:border-b-0">
            {Array.from({ length: 6 }).map((_, j) => (
              <Bone key={j} className="h-3.5 flex-1 rounded-sm" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
