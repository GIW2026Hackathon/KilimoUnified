import { MapPin, PhoneCall, Shield } from "lucide-react";
import LanguageToggle from "@/components/shared/language-toggle";
import { TOLL_FREE } from "@/lib/constants";

export default function TopBar() {
  return (
    <div className="w-full border-b border-outline-variant bg-surface-container-lowest px-4 py-2.5 md:px-margin">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 font-body-sm text-body-sm md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-fixed shadow-sm">
            <Shield className="h-5 w-5 fill-current" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-1 font-title-lg text-title-lg leading-none tracking-tight">
              <span className="font-bold text-primary">Maziwa</span>
              <span className="font-bold text-secondary">Shield</span>
            </div>
            <p className="mt-0.5 font-label-caps text-[10px] tracking-wider text-on-surface-variant">
              Healthy Cows • Quality Milk • Better Livelihoods
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-on-surface-variant md:justify-end">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-secondary" aria-hidden />
            <span>Nakuru Agri-Hub &amp; Nairobi Office, Kenya</span>
          </div>
          <a href={`tel:${TOLL_FREE.replace(/\s/g, "")}`} className="hidden items-center gap-1.5 sm:flex">
            <PhoneCall className="h-4 w-4 text-secondary" aria-hidden />
            <span className="font-semibold text-primary">+254 (0) 800 720 444</span>
            <span className="text-xs text-outline">(Toll-Free)</span>
          </a>
          <LanguageToggle variant="landing" />
        </div>
      </div>
    </div>
  );
}