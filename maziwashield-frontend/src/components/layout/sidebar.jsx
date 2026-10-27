"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "@/lib/navigation";
import Avatar from "@/components/ui/avatar";
import { useShell } from "@/components/layout/shell-context";
import SignOutButton from "@/features/auth/components/sign-out-button";

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useShell();
  /* labels show from lg up, unless the desktop sidebar is collapsed to a rail */
  const label = collapsed ? "hidden" : "hidden lg:inline";
  const block = collapsed ? "hidden" : "hidden lg:block";

  return (
    <aside
      aria-label="Primary"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-[72px] select-none flex-col justify-between border-r border-primary bg-primary-container text-surface shadow-xl md:flex",
        collapsed ? "lg:w-[72px]" : "lg:w-[260px]"
      )}
    >
      <div className="custom-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <div className="border-b border-primary/60 p-space-md">
          <div className={cn("flex items-center justify-center gap-2.5", !collapsed && "lg:justify-between")}>
            <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="MaziwaShield dashboard">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-on-tertiary-container/30 bg-surface-container-lowest/10 text-on-tertiary-container shadow-inner">
                <Shield className="h-[22px] w-[22px] fill-current" aria-hidden />
              </div>
              <div className={block}>
                <div className="flex items-baseline font-headline-md text-headline-md font-bold leading-none tracking-tight text-surface-container-lowest">
                  <span>Maziwa</span>
                  <span className="ml-0.5 font-extrabold text-on-tertiary-container">Shield</span>
                </div>
                <p className="mt-1 font-label-caps text-[10px] uppercase tracking-wider text-surface-container-high/80">
                  Healthy Cows • Quality Milk
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn("hidden rounded p-1 text-surface-container/60 transition-colors hover:text-surface-container-lowest", !collapsed && "lg:block")}
            >
              <ChevronsLeft className="h-[18px] w-[18px]" />
            </button>
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="mt-3 hidden w-full justify-center rounded p-1 text-surface-container/60 hover:text-surface-container-lowest lg:flex"
            >
              <ChevronsRight className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        <nav aria-label="Main" className="space-y-1 p-space-sm">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <div key={item.href} className={item.accent ? "pt-2" : undefined}>
                <Link
                  href={item.href}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    !collapsed && "lg:justify-start",
                    item.accent
                      ? "border border-on-tertiary-container/30 bg-tertiary-container/60 text-surface-container-lowest hover:bg-tertiary-container"
                      : active
                        ? "border border-on-tertiary-container/20 bg-surface/15 font-title-md text-title-md text-surface-container-lowest shadow-sm"
                        : "font-body-sm text-body-sm text-surface-container-high/90 hover:bg-surface/10 hover:text-surface-container-lowest"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active || item.accent ? "text-on-tertiary-container" : "text-surface-container/70 group-hover:text-surface-container-lowest"
                    )}
                    aria-hidden
                  />
                  <span className={cn("flex-1", label)}>{item.label}</span>
                  {active && <span className={cn("h-1.5 w-1.5 rounded-full bg-on-tertiary-container", label)} />}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-primary/70 bg-primary/95 p-space-sm">
        <div className={cn("flex items-center justify-center gap-3 rounded-xl border border-surface/10 bg-surface/5 p-2", !collapsed && "lg:justify-start")}>
          <Avatar initials="FM" tone="light" size="lg" />
          <div className={cn("min-w-0 flex-1", block)}>
            <p className="truncate font-title-md text-title-md leading-tight text-surface-container-lowest">Farmer account</p>
            <p className="truncate font-body-sm text-[11px] text-surface-container-high/80">Climate and feed advisor</p>
          </div>
          <SignOutButton label="Sign out" className={cn("flex items-center gap-1 text-xs text-surface-container/60 transition-colors hover:text-surface-container-lowest", collapsed && "hidden", !collapsed && "hidden lg:flex")} />
        </div>
      </div>
    </aside>
  );
}
