import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-sans font-medium uppercase tracking-wider text-xs transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none",
          {
            "bg-ink text-bg border border-ink hover:bg-bg-soft hover:text-ink":
              variant === "primary",
            "border border-ink text-ink bg-transparent hover:bg-ink hover:text-bg":
              variant === "secondary" || variant === "outline",
            "text-ink-soft hover:text-ink hover:bg-bg-hover bg-transparent": variant === "ghost",
            "bg-brand-rosa text-bg hover:bg-brand-rosa/95 border border-brand-rosa":
              variant === "danger",
            "h-8 px-3 text-[10px]": size === "sm",
            "h-10 px-5": size === "md",
            "h-11 px-7 text-sm": size === "lg",
          },
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
