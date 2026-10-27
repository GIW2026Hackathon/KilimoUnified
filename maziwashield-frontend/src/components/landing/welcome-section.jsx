import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WELCOME_CARDS } from "@/features/landing/data";
import Photo from "@/components/shared/photo";
import SectionHeading from "@/components/ui/section-heading";

export default function WelcomeSection() {
  return (
    <section id="about" className="relative scroll-mt-14 border-b border-outline-variant bg-surface-container-low pb-28 pt-16">
      <div className="mx-auto max-w-[1280px] px-4 text-center md:px-margin">
        <SectionHeading
          eyebrow="Community & Climate Defense"
          title="Welcome to MaziwaShield"
          description="Cooperative feed banking standards designed with the Kenya Dairy Board to protect herd nutrition, stabilize off-season milk collection, and eliminate fodder speculation across Central and Rift Valley dairy belts."
          className="mb-16"
        />

        <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
          {WELCOME_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="relative flex flex-col rounded-full border border-outline-variant bg-surface-container-lowest p-6 shadow-md transition-all duration-200 hover:border-secondary md:rounded-xl"
              >
                <div className="relative mb-5 h-48 w-full overflow-hidden rounded-lg">
                  <Photo src={card.image} alt={card.alt} sizes="(min-width: 768px) 33vw, 100vw" />
                  <div className="absolute -bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container-low shadow-md">
                    <Icon className={cn("h-6 w-6", card.filled ? "text-primary" : "text-secondary")} aria-hidden />
                  </div>
                </div>
                <h3 className="mb-2 mt-2 font-headline-md text-headline-md font-semibold text-primary">{card.title}</h3>
                <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">{card.text}</p>
                <Link
                  href="/register"
                  className="mt-auto flex items-center justify-between border-t border-outline-variant pt-3 text-xs font-semibold text-secondary"
                >
                  <span>{card.footer}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Get started with {card.title}</span>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}