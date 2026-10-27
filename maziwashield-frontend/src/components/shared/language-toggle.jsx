"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";

const VARIANTS = {
  dashboard: {
    wrap: "rounded-lg border border-outline-variant bg-surface-container-low p-0.5 text-[11px] font-semibold",
    on: "rounded bg-surface font-bold text-primary shadow-sm",
    off: "rounded text-outline hover:text-on-surface",
  },
  landing: {
    wrap: "rounded-full border border-outline-variant bg-surface-container-low p-0.5 text-xs font-semibold",
    on: "rounded-full bg-primary text-on-primary",
    off: "rounded-full text-on-surface-variant transition-colors hover:text-primary",
  },
  footer: {
    wrap: "rounded-lg border border-primary/60 bg-primary p-0.5",
    on: "rounded bg-secondary text-on-secondary",
    off: "rounded text-primary-fixed hover:text-on-primary",
  },
  auth: {
    wrap: "rounded-full border border-outline-variant/60 bg-surface-container-low p-1 text-xs font-title-md",
    on: "rounded-full bg-surface-container-lowest font-bold text-primary shadow-sm",
    off: "rounded-full text-on-surface-variant hover:text-primary",
  },
};

export default function LanguageToggle({ variant = "dashboard", swLabel = "SWA", className }) {
  const { lang, setLang } = useLanguage();
  const v = VARIANTS[variant] ?? VARIANTS.dashboard;
  return (
    <div role="group" aria-label="Language" className={cn("inline-flex items-center", v.wrap, className)}>
      {[
        ["en", "EN"],
        ["sw", swLabel],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={cn("min-h-11 px-3 transition-colors md:min-h-0 md:px-2.5 md:py-1", lang === code ? v.on : v.off)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}