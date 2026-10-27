"use client";

import { useState } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/lib/images";
import { TESTIMONIALS } from "@/features/landing/data";
import Photo from "@/components/shared/photo";

export default function TestimonialSection() {
  const [index, setIndex] = useState(0);
  const t = TESTIMONIALS[index];

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <Photo src={IMAGES.testimonialHills} alt="Misty green pasture hills of the Kenyan Rift Valley at dawn" />
      <div className="absolute inset-0 bg-primary/85 backdrop-blur-[2px]" />

      <div className="relative mx-auto max-w-4xl px-margin-mobile text-center text-on-primary md:px-margin">
        <Quote className="mx-auto mb-4 h-14 w-14 text-tertiary-fixed opacity-80" aria-hidden />
        <figure aria-live="polite">
          <blockquote className="mb-8 font-display-hero text-headline-xl font-normal italic leading-tight text-on-primary md:text-display-hero">
            “{t.quote.replace(/^“|”$/g, "")}”
          </blockquote>
          <figcaption className="space-y-1">
            <p className="font-title-lg text-title-lg tracking-wide text-tertiary-fixed">{t.name}</p>
            <p className="font-body-md text-body-md text-primary-fixed">{t.role}</p>
          </figcaption>
        </figure>

        <div className="mt-6 flex items-center justify-center" role="group" aria-label="Choose testimonial">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.name}
              type="button"
              aria-label={`Show testimonial from ${item.name}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className="flex h-11 items-center px-1"
            >
              <span className={cn("h-1.5 rounded-pill", i === index ? "w-10 bg-on-tertiary-container" : "w-3 bg-on-primary/30 hover:bg-on-primary/50")} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}