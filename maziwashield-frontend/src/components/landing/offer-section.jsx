import { ArrowRight } from "lucide-react";
import { OFFER_ITEMS } from "@/features/landing/data";
import Photo from "@/components/shared/photo";
import Button from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";

export default function OfferSection() {
  return (
    <section id="services" className="scroll-mt-14 border-b border-outline-variant bg-surface-container-low py-20">
      <div className="mx-auto max-w-[1280px] px-4 text-center md:px-margin">
        <SectionHeading
          eyebrow="Certified Nutritional Rations"
          title="What We Offer"
          description="Standardized, aflatoxin-screened feed assets stored in regional climate bunkers, delivered on-demand via cooperative logistics networks."
          className="mb-16"
        />

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {OFFER_ITEMS.map((item) => (
            <li key={item.title} className="group flex flex-col items-center">
              <div className="dotted-lime-border relative mb-5 h-44 w-44 rounded-full transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Photo src={item.image} alt={item.alt} sizes="176px" />
                </div>
              </div>
              <h3 className="mb-1 font-headline-md text-headline-md font-semibold text-primary">{item.title}</h3>
              <p className="max-w-[220px] text-center font-body-sm text-body-sm text-on-surface-variant">{item.text}</p>
              <div className="mt-3 font-title-md text-title-md text-primary">
                KES <span className="font-bold">{item.price.toLocaleString("en-KE")}</span>{" "}
                <span className="text-xs font-normal text-outline">{item.unit}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-14">
          <Button href="/#marketplace" size="lg" className="px-8 shadow-md hover:bg-surface-tint">
            <span>View Full Feed Catalog &amp; Prices</span>
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}