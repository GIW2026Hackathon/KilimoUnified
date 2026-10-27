"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFarms } from "@/lib/api";
import Skeleton from "@/components/ui/skeleton";

const FILTERS = ["all", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
const LABELS = { all: "All farms", HIGH: "High feed risk", MEDIUM: "Moderate feed risk", LOW: "Low feed risk", UNKNOWN: "Unknown feed status" };

export default function FarmsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const visibleFarms = useMemo(
    () => (farmsQuery.data || [])
      .filter((farm) => filter === "all" || farm.feedStatus === filter)
      .filter((farm) => `${farm.name} ${farm.location} ${farm.county}`.toLowerCase().includes(query.toLowerCase())),
    [farmsQuery.data, filter, query]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-headline-xl text-headline-xl-mobile font-bold text-primary md:text-headline-xl">My farms</h1>
            <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">Review farm profiles, local forecast availability, and recorded feed status.</p>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3">
              <label className="relative block w-full max-w-md">
                <span className="sr-only">Search farms by name or location</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search farm or county..." className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter farms by recorded feed status">
                {FILTERS.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={filter === item ? "min-h-10 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white" : "min-h-10 rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high"}>{LABELS[item]}</button>)}
              </div>
            </div>
            <Link href="/dashboard" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary">Open advisor dashboard</Link>
          </div>
        </div>
      </section>

      {farmsQuery.isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Loading farms"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      ) : farmsQuery.isError ? (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-6 text-sm text-error">{farmsQuery.error.message}<button type="button" onClick={() => farmsQuery.refetch()} className="ml-3 min-h-11 underline">Try again</button></div>
      ) : visibleFarms.length ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleFarms.map((farm) => (
            <li key={farm.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
              <div>
                <span className="rounded-full border border-outline-variant px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">Feed status: {farm.feedStatus}</span>
                <h2 className="mt-3 font-headline-md text-headline-md font-bold text-primary">{farm.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant"><MapPin className="h-4 w-4 shrink-0 text-outline" aria-hidden />{farm.location}{farm.county ? `, ${farm.county}` : ""}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 text-sm">
                <div><dt className="text-xs text-outline">Herd size</dt><dd className="mt-1 font-semibold text-primary">{farm.herdSize ?? "Not recorded"}</dd></div>
                <div><dt className="text-xs text-outline">Climate risk</dt><dd className="mt-1 font-semibold text-primary">{farm.climateRisk.level}</dd></div>
              </dl>
              <Link href={`/farms/${farm.id}`} className="mt-auto inline-flex min-h-11 items-center justify-end gap-1 border-t border-outline-variant/50 pt-3 text-sm font-semibold text-primary hover:underline">View farm details <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">{farmsQuery.data?.length ? "No farms match your search and filters." : "No farm profiles are registered yet."}</p>
      )}
    </div>
  );
}
