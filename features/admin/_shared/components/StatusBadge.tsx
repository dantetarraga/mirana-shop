import { cn } from "@/lib/utils";

interface StatusConfig {
  label:      string;
  cls:        string;
  outlineCls: string;
}

interface StatusBadgeProps {
  config:     StatusConfig;
  variant?:   "filled" | "outlined";
  className?: string;
}

export function StatusBadge({ config, variant = "filled", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "font-display font-extrabold text-[12px] tracking-[1px] uppercase px-[11px] py-1 inline-block",
        variant === "filled" ? config.cls : config.outlineCls,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
