import { cls } from '@/shared/lib/admin-classes'

interface FormFieldProps {
  label:    string
  error?:   string
  children: React.ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className={`${cls.label} block`}>{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-[#ff6644]">{error}</p>}
    </div>
  )
}
