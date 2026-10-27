import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CloudSun, MapPin, ShieldCheck, Sprout, Truck } from "lucide-react";
import { FARMS } from "@/features/farms/data";
import { IMAGES } from "@/lib/images";
import Photo from "@/components/shared/photo";

const STATUS_STYLES = {
  healthy: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

export function generateStaticParams() {
  return FARMS.map(({ slug }) => ({ farmId: slug }));
}

function Stat({ label, value, note, icon: Icon }) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-outline">{label}</p>
          <p className="mt-2 font-headline-md text-headline-md font-bold text-primary">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      {note && <p className="mt-4 border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">{note}</p>}
    </div>
  );
}

export default function FarmDetailsPage({ params }) {
  const farm = FARMS.find((item) => item.slug === params.farmId);
  if (!farm) notFound();

  const isMuguga = farm.slug === "muguga-highland-shamba";
  const detailDays = isMuguga ? 18 : farm.days;
  const detailStatus = isMuguga ? "warning" : farm.status;
  const detailHerd = isMuguga ? "14 Cows" : farm.herd;
  const detailIntake = isMuguga ? "210 kg/day DM" : farm.intake;
  const detailReserve = isMuguga ? "12,480 kg" : `${farm.reserveTons} Tons`;
  const detailThreshold = isMuguga ? "21 days required" : `${farm.minimumTons} Tons`;
  const progress = Math.min((detailDays / 21) * 100, 100);

  return (
    <div className="space-y-6">
      <Link href="/farms" className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-primary hover:bg-surface-container-low">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to farms
      </Link>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm">
        <div className="relative h-56 bg-surface-container md:h-72">
          <Photo
            src={farm.detailImage}
            alt={isMuguga
              ? "Lush Kenyan highland dairy farmland in Kiambu with grazing Friesian cows and a silage barn"
              : farm.imageAlt}
            sizes="(min-width: 768px) 90vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3 text-white md:inset-x-8 md:bottom-7">
            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[detailStatus]}`}>
              {isMuguga ? "Safety Buffer" : farm.statusLabel} · {detailDays} days of feed
            </span>
            <h1 className="font-headline-xl text-headline-xl-mobile font-bold drop-shadow md:text-headline-xl">{farm.name}</h1>
            <p className="flex items-center gap-2 text-sm text-white/90">
              <MapPin className="h-4 w-4" aria-hidden />
              {farm.location}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/50 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-outline">Cooperative hub</p>
            <p className="mt-1 font-semibold text-primary">{isMuguga ? "Muguga Dairy Co-op Hub #42" : "Regional Dairy Co-op Hub"}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Farm registry active
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Herd Classification"
          value={detailHerd}
          note={isMuguga ? "10 Lactating • 4 In-Calf" : detailIntake}
          icon={Sprout}
        />
        <Stat
          label="Total Secured Fodder"
          value={detailReserve}
          note={isMuguga ? "+4.2% this week" : `${detailDays} days of feed autonomy`}
          icon={Sprout}
        />
        <Stat
          label="Safety Buffer Index"
          value={`${detailDays} / 21 Days`}
          note={isMuguga ? "18 Days Total Runway" : `${farm.statusLabel} · ${detailIntake}`}
          icon={ShieldCheck}
        />
        <Stat label="Farm Manager" value={farm.manager} note="USSD *384*45# active" icon={Truck} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`space-y-6 ${isMuguga ? "xl:col-span-8" : "xl:col-span-12"}`}>
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-outline">Feed security</p>
                <h2 className="mt-1 font-title-lg text-title-lg font-bold text-primary">Feed Reserve Inventory vs Safety Threshold</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[farm.status]}`}>
                {farm.days} / 21 Days
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${farm.name} feed reserve runway`}
              aria-valuemin={0}
              aria-valuemax={21}
              aria-valuenow={Math.min(detailDays, 21)}
              className="h-3 overflow-hidden rounded-full bg-surface-container-high"
            >
              <div
                className={`h-full rounded-full ${detailStatus === "critical" ? "bg-error" : detailStatus === "warning" ? "bg-amber-500" : "bg-secondary"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between gap-3 text-xs text-on-surface-variant">
              <span>Current reserve: {detailReserve}</span>
              <span>Safety threshold: {detailThreshold}</span>
            </div>
          </div>
        </div>

        {isMuguga && (
          <aside className="space-y-6 xl:col-span-4">
              <div className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline">Agro-ecological station</p>
                    <h2 className="mt-1 font-title-lg text-title-lg font-bold text-primary">Muguga Agro-Zone</h2>
                  </div>
                  <CloudSun className="h-6 w-6 text-amber-600" aria-hidden />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <div>
                    <p className="font-headline-md text-headline-md font-bold text-primary">22°C</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Partly cloudy · Humidity 65%</p>
                  </div>
                  <p className="text-right text-xs text-on-surface-variant">Wind<br /><strong className="text-on-surface">11 km/h SE</strong></p>
                </div>
                <p className="rounded-lg border-l-4 border-primary bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant">
                  Dry spell conditions expected to persist for 12 days. Increase silage ration by 2.5 kg per lactating head to sustain milk production.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-outline">Logistics &amp; sub-hub pin</p>
                    <h2 className="mt-1 font-title-lg text-title-lg font-bold text-primary">GPS Dispatch Routing</h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 text-xs font-bold text-primary">1.8 km to Hub</span>
                </div>
                <div className="relative h-48 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container">
                  <Photo
                    src={IMAGES.farmDetailMap}
                    alt="Agricultural GIS map of Kikuyu, Kenya showing farm parcels and access roads"
                    sizes="(min-width: 1280px) 25vw, 100vw"
                  />
                  <div className="absolute left-1/4 top-1/3 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white shadow">
                    Muguga Shamba
                  </div>
                  <div className="absolute bottom-3 right-3 rounded bg-surface-container-lowest/95 px-2 py-1 text-[10px] font-semibold text-primary shadow">
                    Kiambu, Kenya
                  </div>
                </div>
              </div>
          </aside>
        )}
      </section>
    </div>
  );
}
