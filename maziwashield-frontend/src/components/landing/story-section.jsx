import { Shield } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { STORY_FEATURES } from "@/features/landing/data";
import Photo from "@/components/shared/photo";

export default function StorySection() {
  return (
    <section id="features" className="scroll-mt-14 bg-surface-container-lowest py-20">
      <div className="mx-auto max-w-[1280px] px-4 md:px-margin">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="font-label-caps text-label-caps font-bold uppercase tracking-widest text-secondary">
              DRIVEN BY SMALLHOLDER RESILIENCE
            </span>
            <h2 className="mb-4 mt-2 font-headline-xl text-headline-xl-mobile font-bold leading-tight text-primary md:text-headline-xl">
              Know our platform &amp; story
            </h2>
            <p className="mb-8 font-body-md text-body-md leading-relaxed text-on-surface-variant">
              Founded in partnership with veterinary societies and local dairy societies across Meru, Kiambu, and Uasin Gishu, MaziwaShield
              converts unpredictable weather into institutional feed security. Over 12,000 registered dairy keepers now maintain steady milk
              supply through severe dry seasons without liquidating breeding cows.
            </p>

            <ul className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
              {STORY_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low text-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary">{title}</h3>
                    <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative h-[460px] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low shadow-lg">
              <Photo
                src={IMAGES.storyCow}
                alt="A healthy Ayrshire dairy cow in a clean zero-grazing stall with fresh Napier grass in the feed bunk"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-center"
              />
              <div className="absolute inset-x-6 bottom-6 flex items-center gap-4 rounded-xl border-2 border-tertiary-fixed bg-surface-container-lowest/95 p-4 shadow-lg backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fixed">
                  <Shield className="h-6 w-6 fill-current" aria-hidden />
                </div>
                <div>
                  <p className="font-label-numeric-currency text-label-numeric-currency leading-none text-primary">18 Safe Feed Days</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">Guaranteed Reserve per Registered Co-op Cow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}