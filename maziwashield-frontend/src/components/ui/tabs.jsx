"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  underline: {
    list: "flex items-center gap-1 overflow-x-auto md:gap-8",
    tab: "flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-2 py-3.5 font-title-md text-body-sm",
    on: "border-primary font-bold text-primary",
    off: "border-transparent text-outline transition-colors hover:text-primary",
  },
  segmented: {
    list: "inline-flex items-center rounded-lg border border-outline-variant bg-surface-container-low p-0.5 text-xs",
    tab: "min-h-11 rounded px-2.5 py-1 md:min-h-0",
    on: "bg-surface font-bold text-primary shadow-sm",
    off: "text-outline hover:text-on-surface",
  },
};

/* items: [{ value, label, icon, badge }] */
export default function Tabs({ items, value, onChange, variant = "underline", label, idPrefix = "tabs", className }) {
  const refs = useRef([]);
  const v = VARIANTS[variant];

  function onKeyDown(e, index) {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className={cn(v.list, className)}>
      {items.map((item, i) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            ref={(el) => (refs.current[i] = el)}
            id={`${idPrefix}-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(v.tab, active ? v.on : v.off)}
          >
            {Icon && <Icon className="h-[18px] w-[18px]" aria-hidden />}
            <span>{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ value, active, idPrefix = "tabs", children, className }) {
  if (value !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}