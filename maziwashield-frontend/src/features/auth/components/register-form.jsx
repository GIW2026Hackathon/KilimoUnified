"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Grid3x3, Lock, MapPin, Mail, PawPrint, Sprout, User, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTIES, CREDENTIAL_FIELDS, credentialsSchema, registerSchema } from "@/features/auth/schemas";
import { useRegister } from "@/features/auth/hooks";
import RegisterSuccess from "@/features/auth/components/register-success";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";

const STEPS = [
  { n: 1, label: "Account Credentials" },
  { n: 2, label: "Farm & Herd Profile" },
];

const STRENGTH = {
  labels: ["Too short", "Weak", "Fair", "Good", "Strong"],
  bar: ["bg-surface-container-high", "bg-error", "bg-warning", "bg-lime", "bg-brand"],
};

function scorePassword(pw) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return s;
}

/* Resolver switches with the step so step 1 can be validated on its own */
const step1Resolver = zodResolver(credentialsSchema);
const fullResolver = zodResolver(registerSchema);

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState(null);
  const [open, setOpen] = useState(false);
  const mutation = useRegister();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: (values, ctx, opts) => (step === 1 ? step1Resolver : fullResolver)(values, ctx, opts),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      farmName: "",
      county: "Kiambu",
      herdSize: undefined,
      averageDailyMilkLitres: undefined,
      milkPricePerLitreKes: undefined,
      latitude: "",
      longitude: "",
    },
  });

  const password = watch("password") ?? "";
  const score = password ? Math.max(1, scorePassword(password)) : 0;
  const herd = Number(watch("herdSize")) || 0;

  async function next() {
    if (await trigger(CREDENTIAL_FIELDS)) setStep(2);
  }

  function onSubmit(values) {
    mutation.mutate(values, {
      onSuccess: (res) => {
        setCreated({
          name: res.user.name,
          phone: res.user.phone || values.phone,
          farmName: res.farm.name,
          county: res.farm.county,
          herdSize: res.farm.herdSize,
        });
        setOpen(true);
      },
      onError: (error) => {
        Object.entries(error.fields || {}).forEach(([field, message]) => {
          setError(field, { type: "server", message });
        });
      },
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("latitude", coords.latitude.toFixed(6), { shouldValidate: true });
        setValue("longitude", coords.longitude.toFixed(6), { shouldValidate: true });
      },
      () => setError("latitude", { type: "location", message: "Location could not be read. Enter coordinates manually." })
    );
  }

  return (
    <>
      <ol className="mb-8 grid grid-cols-2 gap-3" aria-label="Registration steps">
        {STEPS.map(({ n, label }) => {
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={n}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative overflow-hidden rounded-xl border p-3 sm:p-3.5",
                active ? "border-brand bg-white shadow-[0_2px_8px_-2px_rgba(38,167,85,0.15)]" : "border-line bg-card"
              )}
            >
              {active && <div className="absolute inset-x-0 top-0 h-1 bg-brand" />}
              <div className="flex items-center justify-between gap-2">
                <span className={cn("flex items-center gap-1.5 font-title-md text-xs", active ? "font-bold text-forest" : "font-semibold text-on-surface-variant")}>
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold", active || done ? "bg-brand text-white" : "bg-outline-variant/60 text-on-surface")}>
                    {n}
                  </span>
                  {label}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 font-label-caps text-[10px] uppercase tracking-wider", active ? "bg-mint1 text-brand" : "bg-surface-container-high text-on-surface-variant")}>
                  {done ? "Done" : active ? "Current" : "Next"}
                </span>
              </div>
              <div className={cn("mt-2.5 h-1.5 w-full overflow-hidden rounded-full", active ? "bg-mint1" : "bg-surface-container")}>
                <div className={cn("h-full", n === 1 ? (active || done ? "w-full bg-lime" : "w-1/4 bg-brand") : step === 2 ? "w-1/4 bg-brand" : "w-0")} />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="relative rounded-2xl border border-line bg-card p-6 shadow-[0_10px_24px_-4px_rgba(12,92,53,0.06)] sm:p-8">
        <form
          noValidate
          className="space-y-6"
          onSubmit={(e) => {
            if (step === 1) {
              e.preventDefault();
              next();
            } else {
              handleSubmit(onSubmit)(e);
            }
          }}
        >
          {step === 1 && (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <h2 className="flex items-center gap-2 font-title-md text-title-md text-forest">
                  <UserRound className="h-5 w-5" aria-hidden />
                  Step 1: Account Credentials
                </h2>
                <span className="text-xs text-outline">Primary Farm Operator</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input className="sm:col-span-2" label="Full Name" required icon={User} placeholder="e.g. Grace Wanjiku Kiprono" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
                <Input
                  label="Kenyan Phone / M-Pesa Number"
                  required
                  type="tel"
                  placeholder="712 345 678"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  leading={<span className="border-r border-line pr-2 text-xs font-bold text-forest">+254</span>}
                  inputClassName="pl-16"
                  {...register("phone")}
                />
                <Input label="Email Address" type="email" icon={Mail} placeholder="grace.wanjiku@kiambudairy.co.ke" autoComplete="email" error={errors.email?.message} {...register("email")} />
                <Input
                  label="Password"
                  required
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  error={errors.password?.message}
                  inputClassName="font-mono"
                  trailing={
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((s) => !s)}
                      className="flex h-11 w-11 items-center justify-center text-outline transition-colors hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  {...register("password")}
                />
                <Input label="Confirm Password" required icon={Lock} type={showPassword ? "text" : "password"} autoComplete="new-password" error={errors.confirmPassword?.message} inputClassName="font-mono" {...register("confirmPassword")} />
              </div>

              <div className="mt-3.5 rounded-xl border border-line/80 bg-white p-3" aria-live="polite">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-title-md text-forest">Strength: {STRENGTH.labels[score]}</span>
                  <span className="text-[11px] text-outline">12+ chars with special symbol</span>
                </div>
                <div className="grid h-1.5 grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn("rounded-full", i < score ? STRENGTH.bar[score] : "bg-surface-container-high")} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <h2 className="flex items-center gap-2 font-title-md text-title-md text-forest">
                  <Sprout className="h-5 w-5" aria-hidden />
                  Step 2: Farm &amp; Herd Profile
                </h2>
                <span className="text-xs text-outline">Ration Planning Data</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Farm Name / Shamba Title" required icon={Building2} placeholder="e.g. Muguga Highland Dairy Shamba" error={errors.farmName?.message} {...register("farmName")} />
                <Select label="County" required icon={MapPin} options={COUNTIES} error={errors.county?.message} {...register("county")} />

                <div className="sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor="herdSize" className="block font-title-md text-xs text-primary">
                      Herd Size (Lactating Cows + In-calf Heifers) <span className="text-error">*</span>
                    </label>
                    <span className="shrink-0 font-title-md text-[11px] text-brand">Recorded herd: {herd || "—"}</span>
                  </div>
                  <Input
                    id="herdSize"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    icon={PawPrint}
                    placeholder="e.g. 14"
                    error={errors.herdSize?.message}
                    inputClassName="pr-24 font-title-md"
                    trailing={<span className="mr-1 rounded-md bg-mint1 px-2 py-1 font-label-caps text-xs text-forest">HERD #{herd || 0}</span>}
                    {...register("herdSize", { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Average daily milk production (litres)"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 120"
                  error={errors.averageDailyMilkLitres?.message}
                  {...register("averageDailyMilkLitres", { valueAsNumber: true })}
                />
                <Input
                  label="Milk price (KES per litre)"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 55"
                  error={errors.milkPricePerLitreKes?.message}
                  {...register("milkPricePerLitreKes", { valueAsNumber: true })}
                />

                <div className="sm:col-span-2 rounded-xl border border-line bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-title-md text-sm text-primary">Farm coordinates for local weather</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Optional now; forecasts remain unavailable until both are provided.</p>
                    </div>
                    <button type="button" onClick={useCurrentLocation} className="min-h-11 rounded-lg border border-lineStrong px-3 py-2 text-xs font-semibold text-forest hover:bg-mint1">
                      Use current location
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Latitude" type="number" min="-90" max="90" step="0.000001" error={errors.latitude?.message} {...register("latitude")} />
                    <Input label="Longitude" type="number" min="-180" max="180" step="0.000001" error={errors.longitude?.message} {...register("longitude")} />
                  </div>
                </div>

                <p className="sm:col-span-2 text-sm text-on-surface-variant">
                  Feed quantities, period requirements, and prices are entered for each estimate on your dashboard.
                </p>
              </div>

              {mutation.isError && !Object.keys(mutation.error?.fields || {}).length && (
                <p role="alert" className="mt-4 rounded-lg border border-error/40 bg-error/5 p-3 text-sm text-error">
                  {mutation.error.message}
                </p>
              )}

            </div>
          )}

          <div className="space-y-3 pt-2">
            {step === 1 ? (
              <Button type="submit" variant="brand" size="lg" className="w-full rounded-[10px] shadow-[0_10px_20px_-5px_rgba(38,167,85,0.4)]">
                <span>Continue to Farm &amp; Herd Profile</span>
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
            ) : (
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button variant="outline" size="lg" onClick={() => setStep(1)} className="rounded-[10px] sm:w-auto">
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                  <span>Back</span>
                </Button>
                <Button type="submit" variant="brand" size="lg" loading={mutation.isPending} className="flex-1 rounded-[10px] shadow-[0_10px_20px_-5px_rgba(38,167,85,0.4)]">
                  <span>Create Cooperative Account</span>
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Button>
              </div>
            )}
            <div className="pt-2 text-center">
              <span className="text-xs text-on-surface-variant">Already registered with your Cooperative?</span>
              <Link href="/login" className="ml-1.5 inline-flex min-h-11 items-center text-xs font-bold text-forest underline decoration-brand underline-offset-4 transition-colors hover:text-brand md:min-h-0">
                Sign in to existing account
              </Link>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint1 text-forest">
            <Grid3x3 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-title-md text-xs text-primary">No internet at your silage pit?</p>
            <p className="text-[11px] text-on-surface-variant">
              Dial <strong>*384*45#</strong> on Safaricom or Airtel for offline field setup.
            </p>
          </div>
        </div>
        <span className="hidden rounded border border-outline-variant/60 bg-white px-2.5 py-1 font-mono text-xs font-bold text-forest sm:inline">*384*45#</span>
      </div>

      <RegisterSuccess open={open} data={created} onClose={() => setOpen(false)} onContinue={() => router.push("/dashboard")} />
    </>
  );
}
