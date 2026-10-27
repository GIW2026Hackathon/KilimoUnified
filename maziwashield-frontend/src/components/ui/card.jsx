import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface-container-lowest shadow-[0_4px_16px_-2px_rgba(12,92,53,0.05)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div className={cn("flex flex-col gap-2 border-b border-outline-variant/40 pb-3 sm:flex-row sm:items-center sm:justify-between", className)} {...props} />
  );
}

export function CardTitle({ as: Tag = "h3", className, ...props }) {
  return <Tag className={cn("font-title-lg text-title-lg text-primary", className)} {...props} />;
}