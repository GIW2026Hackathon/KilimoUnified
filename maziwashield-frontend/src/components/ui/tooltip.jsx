"use client";

import { cloneElement, useId } from "react";
import { cn } from "@/lib/utils";

const SIDES = { top: "bottom-full mb-1.5", bottom: "top-full mt-1.5" };

export default function Tooltip({ label, children, side = "top", className }) {
  const id = useId();
  return (
    <span className={cn("group relative inline-flex", className)}>
      {cloneElement(children, { "aria-describedby": id })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl bg-inverse-surface px-2 py-1 text-[11px] font-medium text-inverse-on-surface opacity-0 shadow-md transition-opacity group-focus-within:opacity-100 group-hover:opacity-100",
          SIDES[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}