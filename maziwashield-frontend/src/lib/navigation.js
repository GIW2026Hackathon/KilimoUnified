import {
  BarChart3,
  BrainCircuit,
  CloudSun,
  Home,
  LayoutDashboard,
  Radio,
  ShoppingCart,
  Store,
  Warehouse,
} from "lucide-react";

/* Single source for sidebar, icon rail, bottom nav and "More" sheet */
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/farms", label: "Farms & Shambas", short: "Farms", icon: Home, badge: { type: "count", text: "4" } },
  { href: "/feed-inventory", label: "Feed Inventory", short: "Inventory", icon: Warehouse },
  { href: "/feed-suppliers", label: "Feed Suppliers", icon: Store },
  { href: "/procurement", label: "Procurement", icon: ShoppingCart, badge: { type: "coop", text: "Co-op" } },
  { href: "/weather", label: "Weather & Climate", icon: CloudSun },
  { href: "/alerts", label: "Alerts & Telemetry", short: "Alerts", icon: Radio, badge: { type: "alert", text: "2" } },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/ai-assistant", label: "AI Assistant", icon: BrainCircuit, badge: { type: "ai", text: "AI Green" }, accent: true },
];

/* Breadcrumb + header action per route. `action.name` is handled by useShellAction(name, fn) in the page. */
export const PAGE_META = {
  "/dashboard": {
    parent: "Dashboard",
    title: "Overview & Feed Reserve Guard",
    shortTitle: "Dashboard",
    action: { label: "Quick Action", name: "quick-action" },
  },
  "/farms": {
    parent: "Farms",
    title: "Shamba Portfolio",
    shortTitle: "Farms",
    action: { label: "Add Shamba / Farm", name: "add-farm" },
  },
  "/feed-inventory": {
    parent: "Dashboard",
    title: "Feed Inventory & Reserves",
    shortTitle: "Inventory",
    action: { label: "Add Feed Item", name: "add-feed" },
  },
  "/feed-suppliers": {
    parent: "Dashboard",
    title: "Feed Suppliers & Cooperative Aggregators",
    shortTitle: "Suppliers",
    action: { label: "Add Supplier", name: "add-supplier" },
  },
  "/procurement": {
    parent: "Dashboard",
    title: "Procurement",
    shortTitle: "Procurement",
    action: { label: "New Purchase Order", name: "new-po" },
  },
  "/weather": { parent: "Dashboard", title: "Weather & Climate", shortTitle: "Weather", action: null },
  "/alerts": { parent: "Dashboard", title: "Alerts & Telemetry", shortTitle: "Alerts", action: null },
  "/reports": { parent: "Dashboard", title: "Reports & Analytics", shortTitle: "Reports", action: null },
  "/ai-assistant": { parent: "Dashboard", title: "AI Assistant", shortTitle: "AI Assistant", action: null },
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
  return key ? { ...base, parent: base.shortTitle, title: "Details", action: null } : base;
}