import { Bot, Home, LayoutDashboard } from "lucide-react";

/* Single source for sidebar, icon rail, bottom nav and "More" sheet */
export const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    short: "Home",
    icon: LayoutDashboard,
  },
  { href: "/farms", label: "Farms", short: "Farms", icon: Home },
  { href: "/assistant", label: "Farm assistant", short: "Ask AI", icon: Bot },
];

/* Breadcrumb labels for the MVP pages. */
export const PAGE_META = {
  "/dashboard": {
    parent: "Dashboard",
    title: "Climate, feed and financial outlook",
    shortTitle: "Dashboard",
    action: null,
  },
  "/farms": {
    parent: "Farms",
    title: "Farm profiles",
    shortTitle: "Farms",
    action: null,
  },
  "/assistant": {
    parent: "Farm assistant",
    title: "Answers grounded in your farm records",
    shortTitle: "Assistant",
    action: null,
  },
};

export function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const key = Object.keys(PAGE_META)
    .filter((k) => pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  const base = key ? PAGE_META[key] : PAGE_META["/dashboard"];
  /* Nested routes (e.g. /farms/[farmId]) keep the parent crumb and drop the page action */
  return key
    ? { ...base, parent: base.shortTitle, title: "Details", action: null }
    : base;
}
