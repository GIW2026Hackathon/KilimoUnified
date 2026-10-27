"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/use-dialog";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-2xl" };

/* For forms: give <form id="x"> inside children and use <button form="x" type="submit"> in `footer`. */
export default function Modal({ open, onClose, title, description, icon: Icon, children, footer, size = "md", className }) {
  const [mounted, setMounted] = useState(false);
  const ref = useDialog({ open: open && mounted, onClose });
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-forest/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden bg-surface-container-lowest outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-line sm:shadow-[0_20px_32px_-8px_rgba(2,85,49,0.22)]",
          SIZES[size],
          className
        )}
      >
        <div className="h-1.5 w-full shrink-0 bg-lime" />
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-mint1 text-primary">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
            )}
            <div>
              <h2 id={titleId} className="font-headline-md text-headline-md font-bold text-primary">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-xs text-on-surface-variant">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-low hover:text-primary md:h-8 md:w-8"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="custom-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-line bg-card px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}