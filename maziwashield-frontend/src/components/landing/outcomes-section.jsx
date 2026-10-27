import { OUTCOMES } from "@/features/landing/data";

export default function OutcomesSection() {
  return (
    <section
      id="outcomes"
      className="scroll-mt-14 bg-gradient-to-r from-deepForest via-forest to-[#0A5834] py-12 text-on-primary"
    >
      <div id="resources" className="mx-auto max-w-[1280px] scroll-mt-14 px-margin-mobile md:px-margin">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="font-label-caps text-label-caps tracking-wider text-on-tertiary-container">MEASURABLE LIVESTOCK IMPACT</span>
          <h2 className="mt-1 font-headline-lg text-headline-lg-mobile text-on-primary md:text-headline-lg">
            Verified Productivity Metrics Across Enrolled Herds
          </h2>
        </div>

        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {OUTCOMES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center p-3 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-on-tertiary-container/80 bg-primary-container shadow-inner">
                <Icon className="h-8 w-8 text-on-tertiary-container" aria-hidden />
              </div>
              <h3 className="font-title-md text-title-md text-on-primary">{title}</h3>
              <p className="mt-1 font-body-sm text-body-sm text-primary-fixed">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}