import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BLOGS } from "@/features/landing/data";
import Photo from "@/components/shared/photo";

export default function BlogsSection() {
  return (
    <section id="blog" className="scroll-mt-14 bg-primary py-16 text-on-primary md:py-24">
      <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-margin">
        <div className="mb-12 flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <span className="font-label-caps text-label-caps tracking-wider text-on-tertiary-container">FIELD RESEARCH &amp; EXTENSION</span>
            <h2 className="mt-1 font-headline-xl text-headline-xl text-on-primary">Latest Blogs &amp; Field Advisories</h2>
            <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-primary-fixed">
              Practical veterinary advisories, laboratory silage assessments, and financial risk mitigation strategies prepared by our regional
              livestock agronomists.
            </p>
          </div>
          <Link
            href="/#blog"
            className="mt-4 inline-flex min-h-11 items-center space-x-1 font-title-md text-title-md text-on-tertiary-container transition-colors hover:text-tertiary-fixed md:mt-0"
          >
            <span>View all advisory bulletins</span>
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {BLOGS.map((b) => (
            <li key={b.title} className="flex">
              <article className="flex w-full flex-col overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest text-on-surface shadow-md transition-all hover:shadow-xl">
                <div className="relative h-52 overflow-hidden">
                  <Photo src={b.image} alt={b.alt} sizes="(min-width: 768px) 33vw, 100vw" />
                  <span className="absolute left-3 top-3 rounded-pill bg-primary px-2.5 py-1 font-label-caps text-label-caps text-on-primary">
                    {b.meta}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-headline-md text-headline-md leading-tight text-primary">{b.title}</h3>
                  <p className="mt-3 flex-1 font-body-md text-body-md text-on-surface-variant">{b.text}</p>
                  <div className="mt-4 border-t border-outline-variant pt-4">
                    <Link
                      href="/#blog"
                      className="inline-flex min-h-11 items-center space-x-1 font-title-md text-title-md text-secondary transition-colors hover:text-primary"
                    >
                      <span>Read Advisory</span>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}