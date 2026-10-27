import { FARMERS } from "@/features/landing/data";
import Photo from "@/components/shared/photo";

export default function FarmersSection() {
  return (
    <section id="farmers" className="scroll-mt-14 border-y border-outline-variant bg-surface-container-low py-16 md:py-24">
      <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-margin">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="font-label-caps text-label-caps tracking-wider text-secondary">COMMUNITY LEADERSHIP</span>
          <h2 className="mt-1 font-headline-xl text-headline-xl text-primary">Trusted by over 12,000 Dairy Keepers Across Kenya</h2>
          <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
            From small family shambas to commercial co-op unions, meet the stewards safeguarding Kenya&apos;s milk supply with verified feed
            reserves.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FARMERS.map((f) => (
            <li
              key={f.name}
              className="flex flex-col items-center rounded-card border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="custom-dotted-ring mb-4 rounded-full">
                <div className="relative h-32 w-32 overflow-hidden rounded-full">
                  <Photo src={f.image} alt={f.alt} sizes="128px" />
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary">{f.name}</h3>
              <p className="font-title-md text-title-md text-secondary">{f.herd}</p>
              <span className="mt-1 inline-block rounded-pill bg-surface-container px-2.5 py-0.5 font-label-caps text-label-caps text-on-surface-variant">
                {f.place}
              </span>
              <p className="mt-3 font-body-sm text-body-sm italic text-on-surface-variant">&ldquo;{f.quote}&rdquo;</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}