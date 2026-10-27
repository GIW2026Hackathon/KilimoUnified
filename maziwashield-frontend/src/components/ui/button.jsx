import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-secondary text-on-secondary shadow-sm hover:bg-primary",
  forest: "bg-primary-container text-white shadow-sm hover:bg-deepForest",
  brand: "bg-brand text-white shadow-sm hover:bg-brand-hover",
  outline: "border border-outline-variant bg-surface-container-low text-primary hover:bg-surface-container-high",
  mint: "border border-lineStrong bg-card text-primary-container hover:bg-mint1",
  ghost: "text-on-surface-variant hover:bg-surface-container-high",
  danger: "bg-error text-on-error hover:opacity-90",
};

/* min-h-11 = 44px touch target on mobile */
const SIZES = {
  sm: "min-h-11 px-3 py-1.5 text-sm md:min-h-8 md:text-xs",
  md: "min-h-11 px-4 py-2 text-sm md:min-h-9 md:text-[13px]",
  lg: "min-h-12 px-6 py-3 text-base",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", href, className, loading, disabled, children, type = "button", ...props },
  ref
) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-title-md font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if (href) {
    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export default Button;