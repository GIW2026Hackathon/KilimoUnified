"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, Eye, EyeOff, Grid3x3, Key, Lock, LogIn, ShieldCheck, Smartphone, X } from "lucide-react";
import { loginSchema } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/hooks";
import { useToast } from "@/components/ui/toast";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { USSD_CODE } from "@/lib/constants";

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const mutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "", remember: true } });

  function onSubmit(values) {
    setDismissed(false);
    mutation.mutate(values, { onSuccess: () => router.push("/dashboard") });
  }

  return (
    <div className="relative rounded-2xl border border-line bg-card p-7 shadow-[0_10px_24px_-4px_rgba(12,92,53,0.08),0_2px_6px_-1px_rgba(12,92,53,0.04)] sm:p-10">
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-lime" />

      <div className="mb-7">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md font-semibold text-deepForest">Welcome back, Dairy Keeper</h2>
          <Lock className="h-6 w-6 text-forest/60" aria-hidden />
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">Sign in to manage herd feed reserves, bulk orders, and shortage forecasts.</p>
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
          id="identifier"
          label="Email or M-Pesa Phone Number"
          hint="Kenyan format"
          icon={Smartphone}
          autoComplete="username"
          placeholder="e.g. 0712 345 678 or farmer@nakurudairy.co.ke"
          error={errors.identifier?.message}
          inputClassName="border-lineStrong py-3 text-ink"
          {...register("identifier")}
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="font-label-caps text-label-caps font-semibold uppercase text-forest">
              Account Password / Cooperative PIN
            </label>
            <button
              type="button"
              onClick={() => toast({ title: "Reset link sent", description: `Check SMS, or dial ${USSD_CODE} to reset your PIN.`, tone: "info" })}
              className="min-h-11 text-xs font-semibold text-brand transition-colors hover:text-brand-hover md:min-h-0"
            >
              Forgot PIN or Password?
            </button>
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            icon={Key}
            autoComplete="current-password"
            placeholder="Enter your security credentials"
            error={errors.password?.message}
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex min-h-11 cursor-pointer select-none items-center gap-2.5">
            <input type="checkbox" className="h-5 w-5 cursor-pointer rounded-[4px] border-2 border-lineStrong text-brand focus:ring-brand focus:ring-offset-0" {...register("remember")} />
            <span className="text-xs font-medium text-on-surface-variant">Remember this device for 30 days</span>
          </label>
          <span className="inline-flex items-center gap-1 rounded border border-lineStrong/50 bg-mint1 px-2 py-0.5 text-[11px] font-medium text-forest">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            256-bit Encrypted
          </span>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="brand" size="lg" loading={mutation.isPending} className="w-full rounded-[10px] shadow-[0_4px_12px_-2px_rgba(38,167,85,0.3)]">
            <span>Sign In to Feed Reserves</span>
            <LogIn className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div className="w-full border-t border-line" />
          <span className="absolute bg-card px-3 font-label-caps text-[10px] font-semibold uppercase tracking-wider text-outline">Or Authenticate Offline</span>
        </div>

        <button
          type="button"
          onClick={() => toast({ title: "USSD one-time code", description: `Dial ${USSD_CODE} on your phone to receive a sign-in code.`, tone: "info" })}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-lineStrong bg-white px-5 py-2.5 font-title-md text-body-md font-semibold text-forest transition-all duration-150 hover:border-brand hover:bg-mint1 active:scale-[0.99]"
        >
          <Grid3x3 className="h-[19px] w-[19px] text-brand" aria-hidden />
          <span>Sign in with USSD One-Time Code</span>
        </button>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-6 text-xs">
        <span className="font-medium text-on-surface-variant">New to MaziwaShield?</span>
        <Link href="/register" className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand transition-colors hover:text-brand-hover">
          <span>Create cooperative account</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
        </Link>
      </div>
    </div>
  );
}