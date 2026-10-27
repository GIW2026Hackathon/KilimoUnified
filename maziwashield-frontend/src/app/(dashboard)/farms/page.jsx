"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search, Sprout } from "lucide-react";
import { FARMS } from "@/features/farms/data";
import Photo from "@/components/shared/photo";

const FILTERS = [
  { value: "all", label: "All Farms (4)" },
  { value: "healthy", label: "Healthy Buffer (>21 Days)" },
  { value: "critical", label: "At Risk (<14 Days)" },
  { value: "kiambu", label: "Kiambu Hub" },
  { value: "nakuru", label: "Nakuru Hub" },
];

const STATUS_STYLES = {
  healthy: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

function matchesFilter(farm, filter) {
  if (filter === "all") return true;
  if (filter === "healthy") return farm.days > 21;
  if (filter === "critical") return farm.days < 14;
  return farm.location.toLowerCase().includes(filter);
}

export default function FarmsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visibleFarms = useMemo(
    () =>
      FARMS.filter((farm) => matchesFilter(farm, filter))
        .filter((farm) => `${farm.name} ${farm.location} ${farm.manager}`.toLowerCase().includes(query.toLowerCase())),
    [filter, query]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-xl text-headline-xl-mobile font-bold text-primary md:text-headline-xl">
                Registered Farms &amp; Shambas
              </h1>
              <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-800">
                Institutional Registry
              </span>
            </div>
            <p className="mt-2 max-w-3xl font-body-md text-body-md text-on-surface-variant">
              Monitor herd capacity, feed autonomy runway, and local farm conditions across your cooperative network.
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3">
              <label className="relative block w-full max-w-md">
                <span className="sr-only">Search farm name, county, or manager</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search farm name, county, or manager..."
                  className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter farms">
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={filter === item.value}
                    onClick={() => setFilter(item.value)}
                    className={
                      filter === item.value
                        ? "min-h-10 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm"
                        : "min-h-10 rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Link
              href="/farms/muguga-highland-shamba"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary"
            >
              <Sprout className="h-4 w-4" aria-hidden />
              Open featured farm
            </Link>
          </div>
        </div>
      </section>

      {visibleFarms.length ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
          {visibleFarms.map((farm) => (
            <li key={farm.slug} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-lg">
              <Link href={`/farms/${farm.slug}`} className="group">
                <div className="relative h-44 overflow-hidden bg-surface-container">
                  <Photo
                    src={farm.image}
                    alt={farm.imageAlt}
                    sizes="(min-width: 1536px) 25vw, (min-width: 768px) 50vw, 100vw"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[farm.status]}`}>
                    {farm.statusLabel} · {farm.days} Days
                  </span>
                  <span className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 text-[11px] font-medium text-white">
                    {farm.production}
                  </span>
                </div>
              </Link>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <h2 className="font-headline-md text-headline-md font-bold text-primary">
                    <Link href={`/farms/${farm.slug}`} className="hover:underline">
                      {farm.name}
                    </Link>
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                    <MapPin className="h-4 w-4 shrink-0 text-outline" aria-hidden />
                    {farm.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-outline">Herd Size</span>
                    <span className="mt-1 block text-sm font-semibold text-primary">{farm.herd}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-outline">Daily Intake</span>
                    <span className="mt-1 block text-sm font-semibold text-primary">{farm.intake}</span>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary">Feed reserves remaining</span>
                    <span className="font-bold text-on-surface">{farm.days} / 21 days</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${farm.name} feed reserve runway`}
                    aria-valuemin={0}
                    aria-valuemax={21}
                    aria-valuenow={Math.min(farm.days, 21)}
                    className="h-2.5 overflow-hidden rounded-full bg-surface-container-high"
                  >
                    <div
                      className={`h-full rounded-full ${farm.status === "critical" ? "bg-error" : farm.status === "warning" ? "bg-amber-500" : "bg-secondary"}`}
                      style={{ width: `${Math.min((farm.days / 21) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/50 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {farm.initials}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{farm.manager}</p>
                      <p className="text-[10px] text-on-surface-variant">*384*45# Active</p>
                    </div>
                  </div>
                  <Link
                    href={`/farms/${farm.slug}`}
                    aria-label={`View ${farm.name} details`}
                    className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-surface-container-low"
                  >
                    Details <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          No farms match your search and filters.
        </p>
      )}
    </div>
  );
}
