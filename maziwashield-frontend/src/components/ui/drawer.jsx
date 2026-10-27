"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/use-dialog";

const SIDES = {
  right: "inset-y-0 right-0 w-full border-l sm:w-[390px]",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t",
};

export default function Drawer({ open, onClose, title, description, side = "right", children, footer, className }) {
  const [mounted, setMounted] = useState(false);
  const ref = useDialog({ open: open && mounted, onClose });
  const titleId = useId();

  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-forest/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col border-line bg-surface-container-lowest shadow-xl outline-none",
          SIDES[side],
          className
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-container-low/50 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate font-headline-md text-lg font-bold text-primary">
              {title}
            </h2>
            {description && <p className="text-[11px] font-medium text-outline">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-outline hover:bg-surface-container hover:text-on-surface md:h-8 md:w-8"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="custom-scroll flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-outline-variant/30 bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}