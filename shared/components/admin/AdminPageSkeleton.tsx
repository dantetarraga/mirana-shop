import type { CSSProperties } from 'react'

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse bg-(--sub) ${className ?? ''}`} style={style} />
}

interface AdminPageSkeletonProps {
  hasFilters?: boolean
  rows?: number
  cols?: number
}

export function AdminPageSkeleton({
  hasFilters = false,
  rows = 8,
  cols = 6,
}: AdminPageSkeletonProps) {
  return (
    <div className="px-8 pt-7 pb-12">
      {/* PanelHeader skeleton */}
      <div className="flex items-center justify-between mb-4.5">
        <div className="flex flex-col gap-2">
          <Bone className="h-2.5 w-16 rounded-sm" />
          <Bone className="h-6 w-40 rounded-sm" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-36 rounded-sm" />
          <Bone className="h-9 w-36 rounded-sm" />
        </div>
      </div>

      {/* Filters skeleton */}
      {hasFilters && (
        <div className="flex gap-1.5 mb-4.5">
          <Bone className="h-9 w-52 rounded-sm" />
          <Bone className="h-9 w-32 rounded-sm" />
          <Bone className="h-9 w-32 rounded-sm" />
          <Bone className="h-9 w-32 rounded-sm" />
        </div>
      )}

      {/* Table skeleton */}
      <div className="border border-(--bd) overflow-hidden">
        {/* Header row */}
        <div className="bg-surf border-b border-(--bd) flex gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, i) => (
            <Bone key={i} className="h-2.5 rounded-sm flex-1" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-b border-(--bd) last:border-b-0">
            {Array.from({ length: cols }).map((_, j) => (
              <Bone
                key={j}
                className={`h-3.5 rounded-sm flex-1 ${j === 0 ? 'max-w-48' : ''}`}
                style={{ opacity: 1 - i * 0.08 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
