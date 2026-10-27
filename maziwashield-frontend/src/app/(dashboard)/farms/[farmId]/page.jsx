"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CloudSun, MapPin, Sprout } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFarm } from "@/lib/api";
import Skeleton from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function FarmDetailsPage() {
  const params = useParams();
  const farmId = params?.farmId;
  const farmQuery = useQuery({ queryKey: ["farm", farmId], queryFn: () => getFarm(farmId), enabled: Boolean(farmId) });

  if (farmQuery.isPending) return <div className="space-y-4" aria-label="Loading farm"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (farmQuery.isError) return <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-6 text-sm text-error">{farmQuery.error.message}<button type="button" onClick={() => farmQuery.refetch()} className="ml-3 min-h-11 underline">Try again</button></div>;
  const farm = farmQuery.data;
  if (!farm) return <p className="rounded-xl border p-6 text-sm">Farm details are unavailable.</p>;

  return (
    <div className="space-y-6">
      <Link href="/farms" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-primary hover:bg-surface-container-low"><ArrowLeft className="h-4 w-4" aria-hidden />Back to farms</Link>
      <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-outline">Farm profile</p>
        <h1 className="mt-2 font-headline-xl text-headline-xl-mobile font-bold text-primary md:text-headline-xl">{farm.name}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant"><MapPin className="h-4 w-4" aria-hidden />{farm.location}{farm.county ? `, ${farm.county} County` : ""}</p>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-container-low p-4"><dt className="text-xs text-outline">Herd size</dt><dd className="mt-1 font-semibold text-primary">{farm.herdSize ?? "Not recorded"}</dd></div>
          <div className="rounded-lg bg-surface-container-low p-4"><dt className="text-xs text-outline">Daily milk production</dt><dd className="mt-1 font-semibold text-primary">{farm.averageDailyMilkLitres ?? "Not recorded"} L/day</dd></div>
          <div className="rounded-lg bg-surface-container-low p-4"><dt className="text-xs text-outline">Milk price</dt><dd className="mt-1 font-semibold text-primary">{farm.milkPricePerLitreKes ?? "Not recorded"} KES/L</dd></div>
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><CloudSun className="h-5 w-5 text-secondary" aria-hidden /><h2 className="font-title-lg text-title-lg font-bold text-primary">Climate information</h2></div>
          <p className="mt-3 text-sm">Risk category: <strong>{farm.climateRisk.level}</strong></p>
          <p className="mt-1 text-xs text-on-surface-variant">Forecast status: {farm.climateRisk.status.toLowerCase().replaceAll("_", " ")}. {farm.climateRisk.assumption}</p>
          {farm.climateRisk.indicators.length ? (
            <ul className="mt-4 divide-y divide-outline-variant/40 text-sm">{farm.climateRisk.indicators.map((day) => <li key={day.date} className="py-2"><strong>{day.date}</strong>: {day.precipitationMm ?? "—"} mm precipitation; {day.temperatureMinC ?? "—"}–{day.temperatureMaxC ?? "—"} °C</li>)}</ul>
          ) : <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">No usable dated forecast data is available. Check that coordinates are recorded and refresh weather data.</p>}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><Sprout className="h-5 w-5 text-secondary" aria-hidden /><h2 className="font-title-lg text-title-lg font-bold text-primary">Recorded feed status</h2></div>
          <p className="mt-3 text-2xl font-bold text-primary">{farm.feedStatus}</p>
          {farm.feedItems.length ? <ul className="mt-4 divide-y divide-outline-variant/40 text-sm">{farm.feedItems.map((item) => <li key={item.feedType} className="flex justify-between gap-3 py-2"><span>{item.feedType}</span><span className="text-right">{item.usableStockKg} kg usable · {item.coverageDays ?? "unknown"} days</span></li>)}</ul> : <p className="mt-4 text-sm text-on-surface-variant">No inventory is recorded. Use the advisor dashboard to enter feed quantities for an estimate.</p>}
          <Link href="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Open advisor dashboard</Link>
        </Card>
      </section>
      <Card className="p-5"><h2 className="font-title-md text-title-md font-bold text-primary">Assumptions</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-on-surface-variant">{farm.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></Card>
    </div>
  );
}
