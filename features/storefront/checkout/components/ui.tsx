import React from 'react'

export const input =
  'w-full bg-surf border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[11px] outline-none focus:border-(--gold)/50 transition-colors duration-150'

export function Field({
  label,
  error,
  children,
  span,
}: {
  label: string
  error?: string
  children: React.ReactNode
  span?: number
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <label className="block text-[10px] tracking-[2px] uppercase text-(--gold) mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-[12px] mt-1">{error}</p>}
    </div>
  )
}

export function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-5 h-5 shrink-0 bg-(--gold) text-black font-display font-black text-[11px] flex items-center justify-center">
        {n}
      </span>
      <p className="text-muted">{children}</p>
    </div>
  )
}
