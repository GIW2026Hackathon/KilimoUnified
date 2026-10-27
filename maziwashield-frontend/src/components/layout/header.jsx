"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { getPageMeta } from "@/lib/navigation";

export default function Header() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-outline-variant/50 bg-surface px-margin-mobile pt-[env(safe-area-inset-top)] md:px-margin">
      <div className="flex min-w-0 items-center gap-2.5 md:hidden">
        <Link href="/dashboard" aria-label="MaziwaShield dashboard" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-tertiary-container">
          <Shield className="h-5 w-5 fill-current" aria-hidden />
        </Link>
        <span className="truncate font-title-md text-title-md font-bold text-primary">{meta.shortTitle}</span>
      </div>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 md:flex">
        <Shield className="h-[18px] w-[18px] shrink-0 text-outline" aria-hidden />
        <span className="font-body-sm text-body-sm text-outline">{meta.parent}</span>
        <span className="text-xs text-outline" aria-hidden="true">/</span>
        <span className="truncate font-title-md text-title-md font-bold text-primary">{meta.title}</span>
      </nav>
      <span className="hidden text-xs text-on-surface-variant sm:block">Farm climate and feed planning</span>
    </header>
  );
}
