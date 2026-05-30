import { cn } from "@/shared/lib/utils";
import { A } from "@/shared/lib/admin-classes";

interface Props {
  title: string;
  children: React.ReactNode;
  /** Añade separador superior. false en la primera sección del drawer. */
  divider?: boolean;
}

export function DrawerSection({ title, children, divider = true }: Props) {
  return (
    <div className={cn(divider && "pt-4.5 border-t border-[var(--bd)]")}>
      <div className={cn(A.label, "mb-2.5")}>{title}</div>
      {children}
    </div>
  );
}
