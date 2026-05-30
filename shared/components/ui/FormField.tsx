import { A } from "@/shared/lib/admin-classes";

interface FormFieldProps {
  label:    string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className={`${A.label} block`}>{label}</label>
      {children}
    </div>
  );
}
