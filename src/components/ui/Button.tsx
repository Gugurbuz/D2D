// src/components/ui/Button.tsx
import * as React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const base =
  "inline-flex items-center justify-center font-medium transition-colors select-none " +
  "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[#0099CB] text-white hover:bg-[#0087B3] focus-visible:ring-[#0099CB]",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-300",
  outline:
    "border border-gray-300 text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-300",
  ghost:
    "bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1",
  md: "h-11 px-4 text-[15px] gap-1.5",
  lg: "h-12 px-5 text-base gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      leadingIcon,
      trailingIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cx(
          base,
          variantClass[variant],
          sizeClass[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          // Basit bir spinner (Tailwind ile)
          <span className="mr-2 inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : leadingIcon ? (
          <span className="-ml-0.5">{leadingIcon}</span>
        ) : null}
        <span className="whitespace-nowrap">{children}</span>
        {trailingIcon ? <span className="-mr-0.5">{trailingIcon}</span> : null}
      </button>
    );
  }
);
Button.displayName = "Button";
