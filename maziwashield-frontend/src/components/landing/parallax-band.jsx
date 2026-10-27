import { IMAGES } from "@/lib/images";
import Photo from "@/components/shared/photo";
import Button from "@/components/ui/button";

export default function ParallaxBand() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 text-on-primary">
      <div className="absolute inset-0 z-0">
        <Photo src={IMAGES.bandBarn} alt="Dusk over a dairy farming landscape in Central Kenya with silo towers and feeding troughs" className="brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/95" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <span className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 font-label-caps text-label-caps uppercase tracking-widest text-on-secondary">
          Sovereign Agro-Fintech Infrastructure
        </span>
        <h2 className="mb-6 font-headline-xl text-headline-xl-mobile font-bold leading-tight text-surface md:text-headline-xl">
          Protecting Kenya&apos;s Milk Production from Drought &amp; Price Spikes
        </h2>
        <p className="mx-auto mb-8 max-w-2xl font-body-lg text-body-lg font-light leading-relaxed text-surface-container">
          When forage yields decline by 40% in dry spells, feed cartels double concentrate rates. MaziwaShield anchors stable feed prices by
          locking forward contracts and aggregating grain stover across 14 dairy counties.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/register" size="lg" className="w-full px-8 font-title-md shadow-lg hover:bg-surface-tint sm:w-auto">
            Join Your County Co-op Hub
          </Button>
          <a
            href="/#features"
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-outline-variant px-6 py-3.5 font-title-md text-title-md text-surface transition-colors hover:bg-surface-container-lowest/10 sm:w-auto"
          >
            Calculate Your Silage Runway
          </a>
        </div>
      </div>
    </section>
  );
}