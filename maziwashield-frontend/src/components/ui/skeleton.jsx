import { cn } from "@/lib/utils";

export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-surface-container-high motion-reduce:animate-none", className)} />;
}