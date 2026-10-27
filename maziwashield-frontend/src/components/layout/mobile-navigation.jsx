"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "@/lib/navigation";
import Drawer from "@/components/ui/drawer";
import LanguageToggle from "@/components/shared/language-toggle";
import { useShell } from "@/components/layout/shell-context";

const PRIMARY = ["/dashboard", "/farms", "/feed-inventory", "/alerts"];

export default function MobileNavigation() {
  const pathname = usePathname();
  const { moreOpen, setMoreOpen } = useShell();
  const primary = NAV_ITEMS.filter((i) => PRIMARY.includes(i.href));
  const more = NAV_ITEMS.filter((i) => !PRIMARY.includes(i.href));
  const moreActive = more.some((i) => isActive(pathname, i.href));

  useEffect(() => setMoreOpen(false), [pathname, setMoreOpen]);

  const tab = "relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-label-caps transition-colors active:scale-95";

  return (
    <>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-outline-variant bg-surface-container-lowest px-space-xs pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-2px_rgba(12,92,53,0.06)] md:hidden"
      >
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(tab, "h-16", active ? "text-primary" : "text-outline hover:text-primary")}
            >
              <Icon className="h-6 w-6" aria-hidden />
              <span>{item.short ?? item.label}</span>
              {item.badge?.type === "alert" && <span className="absolute right-[28%] top-2 h-2 w-2 rounded-full bg-error" />}
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
          className={cn(tab, "h-16", moreActive ? "text-primary" : "text-outline hover:text-primary")}
        >
          <Ellipsis className="h-6 w-6" aria-hidden />
          <span>More</span>
        </button>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} side="bottom" title="More">
        <ul className="grid grid-cols-2 gap-3">
          {more.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-sm font-semibold",
                    active ? "border-secondary bg-mint1 text-primary" : "border-line bg-card text-on-surface"
                  )}
                >
                  <Icon className="h-6 w-6 text-secondary" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
          <LanguageToggle />
          <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-error">
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Sign out
          </Link>
        </div>
      </Drawer>
    </>
  );
}