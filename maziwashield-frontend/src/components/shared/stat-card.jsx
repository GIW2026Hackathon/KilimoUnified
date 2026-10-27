import { cn } from "@/lib/utils";

const TONES = {
  mint: { icon: "border-secondary-container bg-secondary-fixed/30 text-secondary", hover: "hover:border-secondary" },
  amber: { icon: "border-amber-200 bg-amber-100 text-amber-700", hover: "hover:border-tertiary-fixed-dim" },
  orange: { icon: "border-orange-200 bg-orange-100 text-orange-700", hover: "hover:border-error" },
  sky: { icon: "border-sky-200 bg-sky-100 text-sky-700", hover: "hover:border-secondary" },
  neutral: { icon: "border-outline-variant/40 bg-surface-container-low text-primary", hover: "hover:border-secondary" },
};

/* rounded-full is the Stitch override (0.75rem) used by the dashboard KPI tiles */
export default function StatCard({ label, value, unit, icon: Icon, tone = "mint", children, className }) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-full border border-outline-variant/60 bg-surface-container-lowest p-space-md shadow-sm transition-colors",
        t.hover,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">{label}</span>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border", t.icon)}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
      <div className="mt-3">
        {value !== undefined && (
          <div className="font-label-numeric-currency text-[28px] font-extrabold leading-tight text-primary">
            {value}
            {unit && <span className="ml-1 text-body-sm font-normal text-on-surface-variant">{unit}</span>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}