import { Check, RefreshCw, Shield } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { APP_TAGLINE } from "@/lib/constants";
import Photo from "@/components/shared/photo";

const POINTS = [
  ["Immediate 21-day dry season feed allocation", "Pre-reserved certified bales at regional Kiambu, Nakuru, and Eldoret hubs upon verified registration."],
  ["Direct cooperative bulk buying rates", "Save up to 28% on verified maize silage, Boma Rhodes hay, and high-protein dairy meal."],
  ["Integrated USSD (*384*45#) & M-Pesa automated checking", "Check and release pasture reserves even with basic feature phones in remote fields."],
];

export default function RegisterHero() {
  return (
    <section className="relative flex min-h-[580px] w-full flex-col justify-between overflow-hidden bg-primary p-6 text-on-primary sm:p-10 lg:min-h-screen lg:w-5/12 lg:p-14 xl:w-1/2">
      <div className="absolute inset-0 scale-105 opacity-25 mix-blend-luminosity">
        <Photo
          src={IMAGES.hero}
          alt="Friesian dairy cows grazing in lush green pastures in the Rift Valley of Kenya"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-forest/95 via-forest/90 to-deepForest/[0.98]" />
      <div className="absolute inset-0 bg-[radial-gradient(#a9f3bf_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-fixed-dim/30 bg-surface-container-lowest/10 shadow-sm backdrop-blur-md">
          <Shield className="h-6 w-6 fill-current text-primary-fixed" aria-hidden />
        </div>
        <div>
          <span className="flex items-center font-headline-md text-headline-md tracking-tight text-surface-container-lowest">
            Maziwa<span className="font-bold text-fresh">Shield</span>
          </span>
          <p className="font-label-caps text-label-caps tracking-wider text-primary-fixed-dim/90">{APP_TAGLINE}</p>
        </div>
      </div>

      <div className="relative z-10 my-10 max-w-xl space-y-8 lg:my-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-fixed-dim/30 bg-primary-container px-3 py-1.5 font-title-md text-xs text-primary-fixed">
          <span className="h-2 w-2 animate-pulse rounded-full bg-lime motion-reduce:animate-none" />
          <span>East African Feed Security Reserve Registry</span>
        </div>

        <h1 className="font-headline-xl text-headline-xl font-medium leading-tight text-surface-container-lowest sm:text-display-hero-mobile lg:text-headline-xl">
          Never run short of <span className="italic text-primary-fixed underline decoration-lime/40 decoration-wavy">feed</span> again.
        </h1>
        <p className="font-body-md text-body-md leading-relaxed text-surface-variant/90">
          Shielding smallholder dairy farms and cooperatives against dry seasons with guaranteed escrow feed balances, monitored by the Kenya
          Dairy Board.
        </p>

        <ul className="space-y-4 pt-2">
          {POINTS.map(([title, text]) => (
            <li key={title} className="flex items-start gap-3.5 rounded-xl border border-primary-fixed-dim/20 bg-primary-fixed/5 p-3.5 backdrop-blur-sm">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-lime bg-lime/20">
                <Check className="h-4 w-4 text-lime" strokeWidth={3} aria-hidden />
              </div>
              <div>
                <p className="font-title-md text-title-md text-surface-container-lowest">{title}</p>
                <p className="mt-0.5 font-body-sm text-body-sm text-surface-variant/80">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-primary-fixed-dim/20 pt-6 text-surface-variant/90">
        <div className="flex items-center gap-2 font-title-md text-xs">
          <RefreshCw className="h-[18px] w-[18px] text-primary-fixed" aria-hidden />
          <span>Kenya Dairy Board Ecosystem Partner</span>
        </div>
        <div className="flex items-center gap-3 font-label-caps text-xs text-primary-fixed-dim">
          <span>REG. CERT #KDB-2024-889</span>
          <span aria-hidden="true">•</span>
          <span>256-BIT ENCRYPTION</span>
        </div>
      </div>
    </section>
  );
}