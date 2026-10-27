"use client";

import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { ShellProvider, useShell } from "@/components/layout/shell-context";

function Frame({ children }) {
  const { collapsed } = useShell();
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <a
        href="#main"
        className="sr-only z-[70] rounded-xl bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className={cn("flex min-h-screen min-w-0 flex-col md:pl-[72px]", collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]")}>
        <Header />
        <main id="main" className="flex-1 px-margin-mobile pb-24 pt-5 md:px-margin md:pb-8 md:pt-space-lg">
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

export default function DashboardShell({ children }) {
  return (
    <ShellProvider>
      <Frame>{children}</Frame>
    </ShellProvider>
  );
}