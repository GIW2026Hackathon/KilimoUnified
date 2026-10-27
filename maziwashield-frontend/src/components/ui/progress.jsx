import { cn } from "@/lib/utils";

const BARS = {
  brand: "bg-brand",
  lime: "bg-lime",
  forest: "bg-primary-container",
  secondary: "bg-secondary",
  warning: "bg-amber-500",
  danger: "bg-error",
};
const TRACKS = { default: "bg-surface-container", danger: "bg-error-container" };
const SIZES = { xs: "h-1.5", sm: "h-2", md: "h-2.5" };

export default function Progress({ value, tone = "brand", track = "default", size = "sm", label, className }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full", TRACKS[track], SIZES[size], className)}
    >
      {/* Inline width is data-driven and cannot be a static Tailwind class (justified exception). */}
      <div className={cn("h-full rounded-full", BARS[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}