import { cn } from "@/lib/utils";

export default function SectionHeading({ eyebrow, title, description, as: Tag = "h2", align = "center", tone = "default", className }) {
  const dark = tone === "dark";
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow && (
        <span className={cn("font-label-caps text-label-caps font-bold uppercase tracking-widest", dark ? "text-on-tertiary-container" : "text-secondary")}>
          {eyebrow}
        </span>
      )}
      <Tag className={cn("mb-3 mt-2 font-headline-xl text-headline-xl-mobile font-bold md:text-headline-xl", dark ? "text-surface" : "text-primary")}>
        {title}
      </Tag>
      {description && (
        <p className={cn("font-body-md text-body-md", align === "center" && "mx-auto", "max-w-2xl", dark ? "text-surface-container" : "text-on-surface-variant")}>
          {description}
        </p>
      )}
    </div>
  );
}