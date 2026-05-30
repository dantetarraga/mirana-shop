import React from "react";
import { cn } from "@/shared/lib/utils";
import { A } from "@/shared/lib/admin-classes";

interface KpiCardProps {
  label:      string;
  value:      string | number;
  valueClass?: string;
  children?:  React.ReactNode;
}

export function KpiCard({ label, value, valueClass = "text-text", children }: KpiCardProps) {
  return (
    <div className={A.kpi}>
      <div className={cn(A.label, "mb-2")}>{label}</div>
      <div className={cn("font-display text-[36px] font-black leading-none tracking-[-1px]", valueClass)}>
        {value}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
