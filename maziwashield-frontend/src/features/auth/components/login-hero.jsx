import { BadgeCheck, Check, Shield } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { APP_TAGLINE, USSD_CODE } from "@/lib/constants";
import Photo from "@/components/shared/photo";

const PILLARS = [
  ["Guaranteed 21-day dry season feed cover per registered cow", "Pre-allocated silage bunkers reserved in your sub-county hub."],
  ["Escrow-protected bulk co-op prices via M-Pesa", "Funds released to balers only upon verified weight and moisture audit."],
  ["Real-time satellite & bunker telemetry alerts", "NDVI forage drought warnings delivered directly to SMS and web app."],
];

export default function LoginHero() {
  return (
    <section className="relative flex min-h-[640px] w-full flex-col justify-between overflow-hidden p-8 sm:p-12 lg:min-h-screen lg:w-1/2 lg:p-16">
      <div className="absolute inset-0 z-0 scale-105">
        <Photo
          src={IMAGES.hero}
          alt="Holstein-Friesian and Ayrshire dairy cattle grazing in green pastures across the Kenyan highlands"
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-forest/85 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-forest/90 via-deepForest/80 to-on-primary-fixed/95" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(160,210,68,0.15),_transparent_70%)]" />

      <div className="relative z-20 flex h-full flex-col justify-between gap-12">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line/30 bg-white/10 shadow-lg shadow-black/10 backdrop-blur-md">
            <Shield className="h-[34px] w-[34px] fill-current text-fresh" aria-hidden />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-poppins text-2xl font-bold tracking-tight text-white">
                Maziwa<span className="text-fresh">Shield</span>
              </span>
              <span className="rounded-full border border-lime/40 bg-lime/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-lime">
                Enterprise Co-op
              </span>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm tracking-wide text-line">{APP_TAGLINE}</p>
          </div>
        </div>

        <div className="my-auto max-w-xl py-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-white/10 px-3 py-1.5 font-label-caps text-label-caps uppercase tracking-wider text-lime backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime motion-reduce:animate-none" />
            National Feed Security Reserve Grid
          </div>
          <h1 className="mb-8 font-poppins text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[42px]">
            Never run short of{" "}
            <span className="bg-gradient-to-r from-white via-line to-lime bg-clip-text text-transparent">feed again.</span>
          </h1>
          <ul className="space-y-5">
            {PILLARS.map(([title, text]) => (
              <li key={title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime shadow-md shadow-black/10">
                  <Check className="h-5 w-5 text-deepForest" strokeWidth={3} aria-hidden />
                </div>
                <div>
                  <p className="text-[15px] font-medium leading-snug text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-line/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-lime" aria-hidden />
            <span className="tracking-wide text-line">In partnership with Kenya Dairy Board &amp; Regional Cooperatives</span>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-lg border border-line/20 bg-black/30 px-3 py-1.5 font-mono text-[12px] text-white backdrop-blur-md sm:self-auto">
            <span className="h-2 w-2 animate-ping rounded-full bg-fresh motion-reduce:animate-none" />
            <span className="font-bold text-lime">{USSD_CODE}</span>
            <span className="text-white/70">Sync Active</span>
          </div>
        </div>
      </div>
    </section>
  );
}