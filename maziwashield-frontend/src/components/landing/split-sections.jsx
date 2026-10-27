import { ArrowRightLeft, CheckCircle2, PiggyBank, Shield, ShieldCheck, Users } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import { IMAGES } from "@/lib/images";
import Photo from "@/components/shared/photo";

const CARD_SHADOW = "shadow-[0_10px_24px_-4px_rgba(12,92,53,0.12),0_2px_6px_-1px_rgba(12,92,53,0.04)]";
const MEDIA_SHADOW = "shadow-[0_10px_24px_-4px_rgba(12,92,53,0.08)]";

function Pill({ icon: Icon, label, tone = "text-primary" }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-pill border border-outline-variant bg-surface-container-lowest px-3 py-1">
      <Icon className={cn("h-4 w-4", tone)} aria-hidden />
      <span className={cn("font-label-caps text-label-caps", tone)}>{label}</span>
    </div>
  );
}

export default function SplitSections() {
  return (
    <>
      <section className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-margin-mobile py-6 md:px-margin">
          <div className="flex items-center space-x-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed">
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="font-label-caps text-label-caps text-primary">PART B: OPERATIONAL RESERVE PROTOCOL</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Rift Valley &amp; Central Highlands Silage Allocation Network</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
              <span className="font-title-md text-title-md text-primary">14 Hubs Active</span>
            </div>
            <div className="hidden h-4 border-l border-outline-variant sm:block" />
            <div className="hidden items-center space-x-1 sm:flex">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span>KEBS Certified Bunkers</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] space-y-20 px-margin-mobile md:px-margin">
          {/* Split 1 */}
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="relative lg:col-span-6">
              <div className={cn("relative h-[380px] overflow-hidden rounded-card border border-outline-variant md:h-[440px]", MEDIA_SHADOW)}>
                <Photo
                  src={IMAGES.split[0]}
                  alt="Healthy Friesian and Ayrshire cows feeding at wooden troughs in green paddocks in Nakuru"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
              <div className={cn("absolute -bottom-6 -right-2 max-w-[300px] rounded-card border border-outline-variant bg-surface-container-lowest p-5 md:-right-6 md:bottom-6", CARD_SHADOW)}>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed">
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <span className="mb-1 inline-block rounded-pill border border-outline-variant bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-primary">
                      VERIFIED RESERVE
                    </span>
                    <p className="font-title-md text-title-md leading-tight text-primary">21 days of feed cover guaranteed per registered cow</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 lg:col-span-6 lg:pt-0">
              <Pill icon={Shield} label="FEED SECURITY GUARANTEE" />
              <h2 className="font-headline-xl text-headline-xl leading-tight text-primary">
                Drought-Proof Your Dairy Enterprise: Guaranteed Bunkers &amp; Silage Reserves
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Smallholder dairy producers face cyclical off-season collapses when dry weather spikes feed costs. MaziwaShield partners with
                regional co-ops to pre-pack climate-resilient pit silos and anaerobic drums, locking in your herd&apos;s nutritional continuity
                before dry spells strike.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Daily dry matter intake locked at stable cooperative rates.",
                  "Aflatoxin-screened maize silage with certified 8.5+ MJ/kg metabolizable energy.",
                ].map((t) => (
                  <li key={t} className="flex items-center space-x-3 font-body-md text-body-md text-on-surface">
                    <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-secondary" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Split 2 */}
          <div className="grid grid-cols-1 items-center gap-8 pt-8 lg:grid-cols-12 lg:gap-12">
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-6">
              <Pill icon={Users} label="COLLECTIVE BARGAINING POWER" tone="text-secondary" />
              <h2 className="font-headline-xl text-headline-xl leading-tight text-primary">
                Pooled Cooperative Purchasing: Cut Feed Middlemen &amp; Speculation
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                By aggregating thousands of dairy producers into a unified procurement network, we bypass exploitative brokers. Cooperatives lock
                bulk concentrate rates using secure digital escrow, preserving farmer margins when commercial forage prices skyrocket.
              </p>
              <div className="flex items-center gap-4 pt-2">
                {[
                  ["0% Price Spikes", "Escrow contracts lock ceiling rates for 180 days"],
                  ["48-Hr Dispatch", "County hub delivery direct to pickup points"],
                ].map(([title, text]) => (
                  <div key={title} className="flex-1 rounded-card border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="font-headline-md text-headline-md text-primary">{title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-1 lg:order-2 lg:col-span-6">
              <div className={cn("relative h-[380px] overflow-hidden rounded-card border border-outline-variant md:h-[440px]", MEDIA_SHADOW)}>
                <Photo
                  src={IMAGES.split[1]}
                  alt="Cooperative workers loading compressed silage bales onto a pickup truck at a depot in Kiambu"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              </div>
              <div className={cn("absolute -bottom-6 -left-2 max-w-[320px] rounded-card border border-outline-variant bg-surface-container-lowest p-5 md:-left-6 md:bottom-6", CARD_SHADOW)}>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed">
                    <PiggyBank className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <span className="mb-1 inline-block rounded-pill border border-outline-variant bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-secondary">
                      BULK SAVINGS INDEX
                    </span>
                    <p className="font-title-md text-title-md leading-tight text-primary">
                      <span className="font-label-numeric-currency text-label-numeric-currency text-primary">{formatKES(18500)}</span> saved per
                      lactation cycle on bulk concentrates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}