import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export type ButtonVariant = "accent" | "outline" | "ghost" | "dark" | "tab" | "icon";
export type ButtonSize    = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:     ButtonVariant;
  size?:        ButtonSize;
  /** Para variant="tab": marca el tab como activo */
  active?:      boolean;
  /** width: 100% */
  full?:        boolean;
  /** Clip-path diagonal (estilo hero storefront) */
  clip?:        boolean;
  /** Icono destructivo (hover rojo) — solo para variant="icon" */
  destructive?: boolean;
}

export function Button({
  variant     = "accent",
  size        = "md",
  active      = false,
  full        = false,
  clip        = false,
  destructive = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "ui-btn",
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        active      && "ui-btn--active",
        full        && "ui-btn--full",
        clip        && "ui-btn--clip",
        destructive && "ui-btn--destructive",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
