import { cn } from "@/lib/utils";

const TONES = {
  mint: "border-lineStrong bg-mint1 text-forest",
  brand: "border-transparent bg-secondary-container text-on-secondary-fixed",
  solid: "border-transparent bg-primary text-on-primary",
  warning: "border-warn-line bg-warn-bg text-warn-text",
  danger: "border-danger-line bg-danger-bg text-danger-text",
  info: "border-sky-300 bg-sky-100 text-sky-800",
  neutral: "border-outline-variant/50 bg-surface-container-high text-on-surface-variant",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-[11px]",
};

export default function Badge({ tone = "mint", size = "sm", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold tracking-wide",
        TONES[tone],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}