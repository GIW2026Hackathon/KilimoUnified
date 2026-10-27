"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Lock, ShieldCheck, X } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import Button from "@/components/ui/button";

export default function RegisterSuccess({ open, data, onClose, onContinue }) {
  const [mounted, setMounted] = useState(false);
  const ref = useDialog({ open: open && mounted, onClose });
  const titleId = useId();
  useEffect(() => setMounted(true), []);
  if (!mounted || !open || !data) return null;

  const first = data.name.trim().split(" ")[0];
  const phone = data.phone.replace(/\s/g, "");

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-[0_20px_32px_-8px_rgba(2,85,49,0.22)] outline-none sm:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-lime" />
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-full text-outline transition-colors hover:text-on-surface"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-mint1 shadow-sm">
          <ShieldCheck className="h-8 w-8 fill-brand/20 text-brand" aria-hidden />
        </div>

        <div className="space-y-1.5 text-center">
          <span className="rounded-full bg-mint1 px-2.5 py-0.5 font-label-caps text-[11px] uppercase tracking-wider text-forest">Feed Escrow Certified</span>
          <h2 id={titleId} className="font-headline-md text-headline-md text-primary">
            Your farm is ready!
          </h2>
          <p className="text-xs text-on-surface-variant">
            Welcome {first}, {data.farmName} is now verified on the regional feed registry.
          </p>
        </div>

        <dl className="mt-5 space-y-3 rounded-xl border border-line bg-card p-4 text-xs">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-2">
            <dt className="text-outline">Registered Livestock</dt>
            <dd className="text-right font-title-md text-forest">
              {data.herdSize} Cows • {data.county} Hub Allocated
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-2">
            <dt className="text-outline">Emergency Silage Buffer</dt>
            <dd className="flex items-center gap-1 font-title-md text-brand">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Guaranteed 21-day reserve
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-outline">USSD Mobile Access</dt>
            <dd className="text-right font-mono font-bold text-forest">*384*45# (PIN Sent to {phone.slice(0, 4)}...)</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-2">
          <Button variant="brand" size="lg" onClick={onContinue} className="w-full rounded-[10px]">
            <span>Go to Dashboard</span>
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-[10px] bg-transparent px-4 py-2.5 font-title-md text-xs text-outline transition-colors hover:bg-surface-container-low"
          >
            Review Form Entries
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}