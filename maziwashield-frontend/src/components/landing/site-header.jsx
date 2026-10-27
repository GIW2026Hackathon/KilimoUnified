"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, Headset, Menu, Search, Users, Warehouse, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button";

const LINKS = [
  { href: "#home", label: "HOME" },
  { href: "#about", label: "ABOUT US" },
  { href: "#features", label: "FEATURES" },
  { href: "#services", label: "SERVICES" },
  { href: "#blog", label: "BLOG" },
  { href: "#resources", label: "RESOURCES" },
  { href: "#contact", label: "CONTACT US" },
];

export default function SiteHeader() {
  const [active, setActive] = useState("#home");
  const [open, setOpen] = useState(false);

  const linkClass = (href) =>
    cn(
      "flex min-h-11 items-center gap-1 px-2 py-1 font-title-md text-title-md transition-colors",
      active === href
        ? "border-b-2 border-secondary-fixed text-secondary-fixed"
        : "text-on-primary/90 hover:text-tertiary-fixed"
    );

  return (
    <header className="sticky top-0 z-40 w-full bg-primary shadow-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 md:px-margin">
        <nav aria-label="Primary" className="hidden items-center space-x-1 md:flex md:space-x-3 lg:space-x-6">
          {LINKS.map((l) => (
            <Link key={l.href} href={`/${l.href}`} onClick={() => setActive(l.href)} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <span className="font-title-lg text-title-lg font-bold text-on-primary md:hidden">
          Maziwa<span className="text-secondary-fixed">Shield</span>
        </span>

        <div className="hidden items-center gap-4 lg:flex">
          <button type="button" aria-label="Search registry" className="p-1 text-on-primary transition-colors hover:text-tertiary-fixed">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/login" className="px-2 font-title-md text-sm text-on-primary hover:text-secondary-fixed">
            Sign In
          </Link>
          <Button href="/register" className="px-5 py-2 text-title-md">
            Get Started
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-on-primary md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-primary-container bg-primary px-4 pb-4 md:hidden">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={`/${l.href}`}
                  onClick={() => {
                    setActive(l.href);
                    setOpen(false);
                  }}
                  className={linkClass(l.href)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-3">
            <Button href="/register" size="lg">
              Get Started
            </Button>
            <Link href="/login" className="flex min-h-11 items-center justify-center font-title-md text-on-primary">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

const BOTTOM = [
  { href: "/#home", label: "Reserves", icon: Warehouse },
  { href: "/#features", label: "Calculator", icon: Calculator },
  { href: "/#marketplace", label: "Co-op Orders", icon: Users },
  { href: "/#contact", label: "Advisory", icon: Headset },
];

export function LandingBottomNav() {
  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-outline-variant bg-surface-container-lowest px-space-xs pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-2px_rgba(12,92,53,0.06)] md:hidden"
    >
      {BOTTOM.map((item, i) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex h-16 min-w-11 flex-1 flex-col items-center justify-center py-1 font-label-caps text-[10px] transition-colors active:scale-95",
              i === 0 ? "text-primary" : "text-outline hover:text-primary"
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}