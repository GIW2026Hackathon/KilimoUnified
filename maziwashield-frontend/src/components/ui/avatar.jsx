import { cn } from "@/lib/utils";

const TONES = {
  forest: "bg-primary-container text-white",
  brand: "bg-brand text-white",
  danger: "bg-error text-white",
  olive: "bg-tertiary-container text-white",
  light: "border border-on-tertiary-container/40 bg-on-tertiary-container/20 text-on-tertiary-container",
};
const SIZES = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-sm", lg: "h-10 w-10 text-sm" };

export default function Avatar({ initials, tone = "forest", size = "md", online, className }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full font-title-md font-bold", TONES[tone], SIZES[size], className)}>
      {initials}
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-secondary-fixed ring-2 ring-primary-container" />}
    </span>
  );
}