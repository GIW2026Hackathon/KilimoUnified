"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "@/lib/navigation";
import SignOutButton from "@/features/auth/components/sign-out-button";

export default function MobileNavigation() {
  const pathname = usePathname();
  const tab = "relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-label-caps";

  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-outline-variant bg-surface-container-lowest px-space-xs pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-2px_rgba(12,92,53,0.06)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(tab, "h-16", active ? "text-primary" : "text-outline hover:text-primary")}><Icon className="h-6 w-6" aria-hidden /><span>{item.short || item.label}</span></Link>;
      })}
      <SignOutButton label="Sign out" className={cn(tab, "h-16 text-outline hover:text-primary")} />
    </nav>
  );
}
