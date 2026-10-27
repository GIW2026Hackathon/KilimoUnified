"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, Eye, EyeOff, Key, LogIn, ShieldCheck, UserRound, X } from "lucide-react";
import { loginSchema } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const mutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });

  function onSubmit(values) {
    setDismissed(false);
    mutation.mutate(values, { onSuccess: () => router.push("/dashboard") });
  }

  return (
    <div className="relative rounded-2xl border border-line bg-card p-7 shadow-[0_10px_24px_-4px_rgba(12,92,53,0.08),0_2px_6px_-1px_rgba(12,92,53,0.04)] sm:p-10">
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-lime" />

      <div className="mb-7">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md font-semibold text-deepForest">Welcome back</h2>
          <ShieldCheck className="h-6 w-6 text-forest/60" aria-hidden />
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">Sign in to review your farm profile, weather status, and feed planning estimates.</p>
      </div>

      {mutation.isError && !dismissed && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] p-3.5 text-xs text-[#991B1B] shadow-sm sm:text-sm"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 fill-critical text-[#FEF2F2]" aria-hidden />
          <div className="flex-1">
            <span className="font-semibold">Authentication Notice:</span> {mutation.error.message}
          </div>
          <button
            type="button"
            aria-label="Dismiss alert"
            onClick={() => setDismissed(true)}
            className="-m-2 flex h-11 w-11 items-center justify-center rounded text-[#991B1B] transition-colors hover:text-[#7F1D1D]"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          id="username"
          label="Username"
          hint="For accounts registered here, use your phone number as the username."
          icon={UserRound}
          autoComplete="username"
          placeholder="Enter your username"
          error={errors.username?.message || mutation.error?.fields?.username}
          inputClassName="border-lineStrong py-3 text-ink"
          {...register("username")}
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="font-label-caps text-label-caps font-semibold uppercase text-forest">
              Password
            </label>
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            icon={Key}
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message || mutation.error?.fields?.password}
            inputClassName="border-lineStrong py-3 text-ink"
            trailing={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((s) => !s)}
                className="flex h-11 w-11 items-center justify-center text-outline transition-colors hover:text-forest"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            {...register("password")}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="brand" size="lg" loading={mutation.isPending} className="w-full rounded-[10px] shadow-[0_4px_12px_-2px_rgba(38,167,85,0.3)]">
            <span>Sign in</span>
            <LogIn className="h-5 w-5" aria-hidden />
          </Button>
        </div>

      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-6 text-xs">
        <span className="font-medium text-on-surface-variant">New to MaziwaShield?</span>
        <Link href="/register" className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand transition-colors hover:text-brand-hover">
          <span>Create farmer account</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
