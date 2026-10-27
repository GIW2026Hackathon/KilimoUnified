"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { PRODUCTS } from "@/features/landing/data";
import Photo from "@/components/shared/photo";
import { useToast } from "@/components/ui/toast";

const NAV_BTN =
  "flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary shadow-sm transition-colors hover:bg-surface-container-high active:scale-95";

export default function MarketplaceSection() {
  const track = useRef(null);
  const { toast } = useToast();

  function scroll(dir) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.firstElementChild?.clientWidth ?? 280), behavior: "smooth" });
  }

  return (
    <section id="marketplace" className="scroll-mt-14 bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-margin">
        <div className="mb-12 flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <span className="font-label-caps text-label-caps tracking-wider text-secondary">CERTIFIED CO-OP FEED RESERVES</span>
            <h2 className="mt-1 font-headline-xl text-headline-xl text-primary">Inspected &amp; Quality-Tested Bulk Feeds</h2>
            <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
              Every batch undergoes certified aflatoxin fluorometric screening and dry-matter density lab testing under strict KEBS compliance
              protocols.
            </p>
          </div>
          <div className="mt-6 flex items-center space-x-3 md:mt-0">
            <button type="button" aria-label="Previous products" onClick={() => scroll(-1)} className={NAV_BTN}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" aria-label="Next products" onClick={() => scroll(1)} className={NAV_BTN}>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <ul ref={track} className="custom-scroll flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {PRODUCTS.map((p) => (
            <li
              key={p.id}
              className="flex min-w-[260px] shrink-0 basis-[85%] snap-start flex-col overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-[0_4px_16px_-2px_rgba(12,92,53,0.05)] transition-all hover:shadow-[0_10px_24px_-4px_rgba(12,92,53,0.08)] sm:basis-[45%] lg:min-w-0 lg:basis-auto"
            >
              <div className="relative h-48 overflow-hidden bg-surface-container-low">
                <Photo src={p.image} alt={p.alt} sizes="(min-width: 1024px) 25vw, 85vw" />
                <span className="absolute left-3 top-3 rounded-pill border border-outline-variant bg-surface-container-lowest/90 px-2.5 py-1 font-label-caps text-label-caps text-primary backdrop-blur-sm">
                  {p.tag}
                </span>
                <span className="absolute right-3 top-3 rounded-pill bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps text-on-secondary-fixed">
                  In Hub Stock
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-title-lg text-title-lg text-primary">{p.name}</h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{p.text}</p>
                <div className="mt-auto flex items-baseline justify-between border-t border-outline-variant pt-4">
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">HUB PRICE</span>
                    <p className="font-label-numeric-currency text-label-numeric-currency text-primary">{formatKES(p.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast({ title: "Added to plan", description: `${p.name} is in your co-op order plan.` })}
                    className="min-h-11 rounded-lg bg-secondary px-4 py-2 font-title-md text-title-md text-on-secondary shadow-sm transition-colors hover:bg-primary active:scale-95 md:min-h-0"
                  >
                    Add to plan
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}