"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, MapPin, Send, Shield } from "lucide-react";
import LanguageToggle from "@/components/shared/language-toggle";
import { useToast } from "@/components/ui/toast";
import { TOLL_FREE, USSD_CODE } from "@/lib/constants";

const USEFUL_LINKS = [
  { label: "Feed Reserves", href: "/#services" },
  { label: "Drought Alert Radar", href: "/alerts" },
  { label: "Co-op Bulk Orders", href: "/procurement" },
  { label: "Ration Calculator", href: "/#features" },
  { label: "Farm Advisory", href: "/#advisories" },
  { label: "KEBS Lab Standards", href: "/#advisories" },
];

const HUBS = [
  { name: "Nakuru Agri-Hub", detail: "Pipeline Road Depot, Nakuru" },
  { name: "Nairobi Regional HQ", detail: "Kilimani Agricultural Towers" },
  { name: "Meru Depot", detail: "Central Meru Union Complex" },
];

const LEGAL = ["Privacy Policy", "Terms of Silage Escrow", "Emergency Feed Dispatch"];

const schema = z.object({ email: z.string().min(1, "Enter your email address").email("Enter a valid email address") });

export default function Footer() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  function onSubmit() {
    toast({ title: "You are subscribed", description: "Weekly fodder price benchmarks are on their way." });
    reset();
  }

  return (
    <footer id="contact" className="bg-primary-container pb-12 pt-16 text-on-primary">
      <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-margin">
        <div className="grid grid-cols-1 gap-10 border-b border-primary pb-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 fill-current text-secondary-container" aria-hidden />
              <span className="font-headline-md text-headline-md font-semibold tracking-tight text-on-primary">MaziwaShield</span>
            </div>
            <p className="font-body-md text-body-md text-primary-fixed">Healthy Cows • Quality Milk • Better Livelihoods</p>
            <p className="font-body-sm text-body-sm text-primary-fixed/80">
              MaziwaShield is an institutional livestock feed reserve infrastructure and cooperative escrow network dedicated to eliminating
              dry-season milk production volatility in Kenya.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-pill border border-secondary-container/40 bg-primary px-3 py-1.5 font-label-caps text-label-caps text-on-primary">
                <BadgeCheck className="h-4 w-4 text-secondary-container" aria-hidden />
                Kenya Dairy Board Tech Ecosystem Partner
              </span>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <h2 className="font-title-md text-title-md text-on-primary">Useful Links</h2>
            <ul className="space-y-1 font-body-sm text-body-sm text-primary-fixed">
              {USEFUL_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="inline-flex min-h-11 items-center transition-colors hover:text-tertiary-fixed md:min-h-0">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 lg:col-span-3">
            <h2 className="font-title-md text-title-md text-on-primary">Contact &amp; Regional Hubs</h2>
            <div className="space-y-2 font-body-sm text-body-sm text-primary-fixed">
              {HUBS.map((h) => (
                <p key={h.name} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>
                    <strong>{h.name}:</strong> {h.detail}
                  </span>
                </p>
              ))}
              <div className="space-y-1 border-t border-primary/50 pt-2">
                <p>
                  Toll-Free:{" "}
                  <a className="font-semibold text-tertiary-fixed" href={`tel:${TOLL_FREE.replace(/\s/g, "")}`}>
                    {TOLL_FREE}
                  </a>
                </p>
                <p>
                  USSD Access: <span className="font-semibold text-tertiary-fixed">{USSD_CODE}</span>
                </p>
                <p>
                  Email:{" "}
                  <a className="hover:underline" href="mailto:info@maziwashield.co.ke">
                    info@maziwashield.co.ke
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <h2 className="font-title-md text-title-md text-on-primary">Newsletter &amp; Radar</h2>
            <p className="font-body-sm text-body-sm text-primary-fixed">
              Get weekly fodder price benchmarks, bunker release schedules, and dry-season alerts.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="relative flex items-center">
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "newsletter-error" : undefined}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-3 pr-12 text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary md:text-sm"
                  {...register("email")}
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute bottom-1 right-1 top-1 flex min-w-11 items-center justify-center rounded-lg bg-secondary px-2.5 text-on-secondary transition-colors hover:bg-primary"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {errors.email && (
                <p id="newsletter-error" role="alert" className="text-xs text-error-container">
                  {errors.email.message}
                </p>
              )}
            </form>
            <div className="flex items-center gap-2 pt-2">
              <span className="font-label-caps text-label-caps text-primary-fixed">LANGUAGE:</span>
              <LanguageToggle variant="footer" swLabel="Kiswahili" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 font-body-sm text-body-sm text-primary-fixed/80 md:flex-row">
          <p>© 2025 MaziwaShield Ltd. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6">
            {LEGAL.map((label) => (
              <li key={label}>
                <Link href="/#contact" className="inline-flex min-h-11 items-center transition-colors hover:text-on-primary md:min-h-0">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}