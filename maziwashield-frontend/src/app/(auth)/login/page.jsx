import Link from "next/link";
import LoginHero from "@/features/auth/components/login-hero";
import LoginForm from "@/features/auth/components/login-form";
import AuthTopBar from "@/features/auth/components/auth-top-bar";

export const metadata = { title: "Sign in | MaziwaShield" };

const LEGAL = ["Terms of Feed Security", "Data Privacy", "SLA Registry"];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full flex-col overflow-x-hidden bg-page lg:flex-row">
      <LoginHero />
      <section className="flex min-h-screen w-full flex-col justify-between bg-page p-6 sm:p-10 lg:w-1/2 lg:p-14 xl:p-16">
        <AuthTopBar className="mx-auto mb-6 max-w-xl" pillClassName="border-lineStrong shadow-sm" />
        <div className="mx-auto my-auto w-full max-w-xl py-4">
          <LoginForm />
        </div>
        <footer className="mx-auto flex w-full max-w-xl flex-col items-center justify-between gap-3 border-t border-outline-variant/40 pt-6 text-[11px] text-outline sm:flex-row">
          <div>© 2025 MaziwaShield Africa Ltd. All feed escrow reserves insured.</div>
          <ul className="flex flex-wrap items-center justify-center gap-x-4">
            {LEGAL.map((l) => (
              <li key={l}>
                <Link href="/#contact" className="inline-flex min-h-11 items-center transition-colors hover:text-forest md:min-h-0">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      </section>
    </main>
  );
}