"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, PhoneCall, Plus, Search, Shield } from "lucide-react";
import { getPageMeta } from "@/lib/navigation";
import { TOLL_FREE } from "@/lib/constants";
import Button from "@/components/ui/button";
import LanguageToggle from "@/components/shared/language-toggle";
import { useShell } from "@/components/layout/shell-context";

export default function Header() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const { trigger } = useShell();

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-outline-variant/50 bg-surface px-margin-mobile pt-[env(safe-area-inset-top)] md:px-margin">
      {/* Mobile top bar: brand mark + page title */}
      <div className="flex min-w-0 items-center gap-2.5 md:hidden">
        <Link
          href="/dashboard"
          aria-label="MaziwaShield dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-tertiary-container"
        >
          <Shield className="h-5 w-5 fill-current" aria-hidden />
        </Link>
        <span className="truncate font-title-md text-title-md font-bold text-primary">{meta.shortTitle}</span>
      </div>

      {/* Breadcrumb (tablet and up) */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 md:flex">
        <Shield className="h-[18px] w-[18px] shrink-0 text-outline" aria-hidden />
        <span className="font-body-sm text-body-sm text-outline">{meta.parent}</span>
        <span className="text-xs text-outline" aria-hidden="true">
          /
        </span>
        <span className="truncate font-title-md text-title-md font-bold text-primary">{meta.title}</span>
      </nav>

      <div className="hidden max-w-md flex-1 lg:block">
        <label htmlFor="global-search" className="sr-only">
          Search feed, silage lots, orders and suppliers
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline" />
          <input
            id="global-search"
            type="search"
            placeholder="Search feed, silage lots, orders, supplier KEBS test..."
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-1.5 pl-9 pr-3 font-body-sm text-body-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-low px-2.5 py-1 font-body-sm text-body-sm text-on-surface-variant xl:flex">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          <span>Kiambu Hub • Synced 4m ago</span>
        </div>

        <LanguageToggle className="hidden sm:inline-flex" />

        <Link
          href="/alerts"
          aria-label="Notifications, 2 unread"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high md:h-10 md:w-10"
        >
          <Bell className="h-5 w-5" aria-hidden />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface" />
        </Link>

        <a
          href={`tel:${TOLL_FREE.replace(/\s/g, "")}`}
          aria-label="Call the advisory desk"
          title="Dial Advisory Desk"
          className="hidden h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high sm:inline-flex"
        >
          <PhoneCall className="h-5 w-5" aria-hidden />
        </a>

        {meta.action && (
          <Button onClick={() => trigger(meta.action.name)} aria-label={meta.action.label} className="rounded-xl px-3 sm:px-3.5">
            <Plus className="h-[18px] w-[18px]" aria-hidden />
            <span className="hidden sm:inline">{meta.action.label}</span>
          </Button>
        )}
      </div>
    </header>
  );
}