import Link from "next/link";
import { Sprout } from "lucide-react";
import RegisterHero from "@/features/auth/components/register-hero";
import RegisterForm from "@/features/auth/components/register-form";
import AuthTopBar from "@/features/auth/components/auth-top-bar";

export const metadata = { title: "Register | MaziwaShield" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <RegisterHero />
      <main className="custom-scroll relative flex w-full flex-col justify-between overflow-y-auto bg-page p-4 sm:p-8 lg:w-7/12 lg:p-12 xl:w-1/2 xl:p-14">
        <AuthTopBar className="border-b border-outline-variant/40 pb-6" pillClassName="border-line" />

        <div className="mx-auto w-full max-w-2xl py-6 sm:py-8">
          <div className="mb-8">
            <div className="mb-1 flex items-center gap-2 font-label-caps text-label-caps tracking-widest text-forest">
              <Sprout className="h-4 w-4" aria-hidden />
              COOPERATIVE ONBOARDING PORTAL
            </div>
            <h2 className="font-headline-lg text-headline-lg tracking-tight text-primary sm:text-headline-xl">Join the Feed Reserve Network</h2>
            <p className="mt-1.5 font-body-md text-body-md text-on-surface-variant">
              Register your dairy enterprise in 2 quick steps to secure seasonal buffer feed and subsidized input delivery.
            </p>
          </div>
          <RegisterForm />
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-outline-variant/40 pt-6 text-xs text-outline sm:flex-row">
          <p>© 2025 MaziwaShield Cooperative Trust Ltd. Registered in the Republic of Kenya.</p>
          <div className="flex items-center gap-4">
            <Link href="/#contact" className="inline-flex min-h-11 items-center transition-colors hover:text-primary md:min-h-0">Privacy Charter</Link>
            <span aria-hidden="true">•</span>
            <Link href="/#contact" className="inline-flex min-h-11 items-center transition-colors hover:text-primary md:min-h-0">Feed Escrow By-Laws</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}