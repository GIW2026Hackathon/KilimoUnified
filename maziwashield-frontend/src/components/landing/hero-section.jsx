"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PlayCircle, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/lib/images";
import { HERO_SLIDES } from "@/features/landing/data";
import Photo from "@/components/shared/photo";
import Button from "@/components/ui/button";

const ARROW =
  "absolute z-20 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/30 bg-primary/60 text-on-primary transition-all hover:bg-primary";

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const slide = HERO_SLIDES[index];
  const go = (step) => setIndex((i) => (i + step + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <section
      id="home"
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative flex h-[620px] w-full scroll-mt-14 items-center justify-center overflow-hidden bg-primary md:h-[680px]"
    >
      <div className="absolute inset-0 z-0">
        <Photo
          src={IMAGES.hero}
          alt="Friesian and Ayrshire dairy cows standing together in a green pasture in the Kenyan Rift Valley"
          priority
          className="object-center brightness-90"
        />
        <div className="absolute inset-0 bg-primary/65 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/40" />
      </div>

      <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className={cn(ARROW, "left-4 md:left-8")}>
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button type="button" aria-label="Next slide" onClick={() => go(1)} className={cn(ARROW, "right-4 md:right-8")}>
        <ChevronRight className="h-6 w-6" />
      </button>

      <div aria-live="polite" className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center text-on-primary">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-primary-container/80 px-3.5 py-1 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-tertiary-fixed" />
          <span className="font-label-caps text-label-caps tracking-wider text-secondary-fixed">{slide.chip}</span>
        </div>

        <h1 className="mb-5 font-display-hero text-display-hero-mobile font-bold leading-tight tracking-tight text-surface md:text-display-hero">
          {slide.lead}
          <span className="font-serif italic text-tertiary-fixed">{slide.accent}</span>
          {slide.tail}
        </h1>

        <p className="mx-auto mb-8 max-w-2xl font-body-lg text-body-lg font-light leading-relaxed text-surface-container">
          {slide.description}
        </p>

        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <Button href={slide.primary.href} size="lg" className="w-full px-8 font-title-md shadow-lg hover:bg-surface-tint sm:w-auto">
            <Warehouse className="h-[18px] w-[18px]" aria-hidden />
            <span>{slide.primary.label}</span>
          </Button>
          <Link
            href={slide.secondary.href}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-surface-container-lowest/30 bg-surface-container-lowest/15 px-6 py-3.5 font-title-md text-title-md text-on-primary backdrop-blur-sm transition-all duration-200 hover:bg-surface-container-lowest/25 sm:w-auto"
          >
            <PlayCircle className="h-5 w-5 text-tertiary-fixed" aria-hidden />
            <span>{slide.secondary.label}</span>
          </Link>
        </div>

        <div className="mt-6 flex items-center" role="group" aria-label="Choose slide">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.accent}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className="flex h-11 items-center px-1.5"
            >
              <span className={cn("h-2 rounded-full", i === index ? "w-8 bg-tertiary-fixed" : "w-2.5 bg-surface-container-highest/50")} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}