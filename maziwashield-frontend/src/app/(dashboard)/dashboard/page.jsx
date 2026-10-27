"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudSun, Sparkles, Sprout, Wallet } from "lucide-react";
import {
  askFarmAssistant,
  getFarms,
  refreshWeather,
  submitAssessment,
} from "@/lib/api";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const emptyInputs = {
  availableFeedKg: "",
  requiredFeedKg: "",
  feedPricePerKgKes: "",
  productionReductionPercent: "",
  periodDays: "7",
};

function money(value) {
  return `KES ${Number(value).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ErrorPanel({ message, retry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-error/30 bg-error/5 p-5 text-sm text-error"
    >
      <p>{message}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-3 min-h-11 font-semibold underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [inputs, setInputs] = useState(emptyInputs);
  const [localErrors, setLocalErrors] = useState({});
  const queryClient = useQueryClient();
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const assessmentMutation = useMutation({
    mutationFn: ({ id, values }) => submitAssessment(id, values),
  });
  const weatherMutation = useMutation({
    mutationFn: refreshWeather,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farms"] }),
  });
  const [aiInsights, setAiInsights] = useState({});
  const insightMutation = useMutation({
    mutationFn: ({ farmId, question }) => askFarmAssistant(farmId, question),
    onSuccess: (result, variables) => {
      setAiInsights((current) => ({ ...current, [variables.kind]: result }));
    },
  });
  const farm = farmsQuery.data?.[0];
  const assessment = assessmentMutation.data;
  const fieldErrors = assessmentMutation.error?.fields || {};

  function change(event) {
    setInputs((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setLocalErrors((current) => ({
      ...current,
      [event.target.name]: undefined,
    }));
    if (assessmentMutation.isError) assessmentMutation.reset();
  }

  function calculate(event) {
    event.preventDefault();
    if (!farm) return;
    const missing = Object.fromEntries(
      [
        "availableFeedKg",
        "requiredFeedKg",
        "feedPricePerKgKes",
        "productionReductionPercent",
      ]
        .filter((key) => inputs[key] === "")
        .map((key) => [key, "This field is required."]),
    );
    setLocalErrors(missing);
    if (Object.keys(missing).length) return;
    assessmentMutation.mutate({
      id: farm.id,
      values: {
        availableFeedKg: Number(inputs.availableFeedKg),
        requiredFeedKg: Number(inputs.requiredFeedKg),
        feedPricePerKgKes: Number(inputs.feedPricePerKgKes),
        productionReductionPercent: Number(inputs.productionReductionPercent),
        periodDays: Number(inputs.periodDays),
      },
    });
  }

  if (farmsQuery.isPending) {
    return (
      <div className="space-y-4" aria-label="Loading farm dashboard">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (farmsQuery.isError) {
    return (
      <ErrorPanel
        message={farmsQuery.error.message}
        retry={() => farmsQuery.refetch()}
      />
    );
  }
  if (!farm) {
    return (
      <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-8 text-center">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Add your farm to begin
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-on-surface-variant">
          Your account has no farm profile yet. Create one to see local weather
          status and calculate feed and financial estimates.
        </p>
        <Link
          href="/register"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Create farm profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-outline">
          Farmer dashboard
        </p>
        <h1 className="mt-1 font-headline-xl text-headline-xl-mobile font-bold text-primary md:text-headline-xl">
          {farm.name}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {farm.location}
          {farm.county ? `, ${farm.county} County` : ""} ·{" "}
          {farm.herdSize ?? "—"} cattle
        </p>
      </div>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Current farm status"
      >
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-outline">
                Climate risk
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {farm.climateRisk.level === "UNAVAILABLE"
                  ? "Unavailable"
                  : farm.climateRisk.level}
              </p>
            </div>
            <CloudSun className="h-6 w-6 text-secondary" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Forecast status:{" "}
            {farm.climateRisk.status.toLowerCase().replaceAll("_", " ")}.{" "}
            {farm.climateRisk.assumption}
          </p>
          {farm.climateRisk.indicators.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
              {farm.climateRisk.indicators.slice(0, 3).map((day) => (
                <li key={day.date}>
                  {day.date}: {day.precipitationMm ?? "—"} mm precipitation;{" "}
                  {day.temperatureMinC ?? "—"}–{day.temperatureMaxC ?? "—"} °C
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={weatherMutation.isPending}
            onClick={() => weatherMutation.mutate(farm.id)}
            className="mt-3 min-h-11 rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold text-primary disabled:opacity-60"
          >
            {weatherMutation.isPending
              ? "Refreshing weather…"
              : "Refresh weather"}
          </button>
          {weatherMutation.data?.weatherRefresh.fallback && (
            <p role="status" className="mt-2 text-xs text-amber-800">
              {weatherMutation.data.weatherRefresh.fallback}
            </p>
          )}
          {weatherMutation.isError && (
            <p role="alert" className="mt-2 text-xs text-error">
              {weatherMutation.error.message}
            </p>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline mt-3 min-h-9 border-lineStrong text-primary"
            disabled={insightMutation.isPending}
            onClick={() =>
              insightMutation.mutate({
                farmId: farm.id,
                kind: "weather",
                question:
                  "Explain my stored weather forecast using only the recorded rainfall and temperature indicators.",
              })
            }
          >
            {insightMutation.isPending &&
            insightMutation.variables?.kind === "weather" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Ask AI about weather
          </button>
          {aiInsights.weather && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-mint1 p-3 text-xs leading-5 text-primary"
            >
              {aiInsights.weather.aiExplanation ||
                "AI explanation is unavailable; the recorded forecast data above remains available."}
              <span className="mt-1 block text-[10px] text-on-surface-variant">
                Supplementary explanation only; forecast measurements above are
                authoritative.
              </span>
            </p>
          )}
          {insightMutation.isError &&
            insightMutation.variables?.kind === "weather" && (
              <p role="alert" className="mt-2 text-xs text-error">
                {insightMutation.error.message}
              </p>
            )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-outline">
                Recorded feed status
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {farm.feedStatus}
              </p>
            </div>
            <Sprout className="h-6 w-6 text-secondary" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Based on existing inventory coverage rules. Risk thresholds are
            provisional; weather does not change this status.
          </p>
          {farm.feedItems.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
              {farm.feedItems.map((item) => (
                <li key={item.feedType}>
                  {item.feedType}: {item.usableStockKg} kg usable,{" "}
                  {item.coverageDays ?? "unknown"} days coverage
                </li>
              ))}
            </ul>
          )}
          {farm.feedItems.length === 0 && (
            <p className="mt-3 text-xs text-on-surface-variant">
              No recorded inventory. Enter usable feed for the estimate below.
            </p>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline mt-3 min-h-9 border-lineStrong text-primary"
            disabled={insightMutation.isPending}
            onClick={() =>
              insightMutation.mutate({
                farmId: farm.id,
                kind: "inventory",
                question:
                  "Explain my recorded feed inventory and how to interpret the usable stock, daily use, coverage, and risk.",
              })
            }
          >
            {insightMutation.isPending &&
            insightMutation.variables?.kind === "inventory" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Ask AI about feed
          </button>
          {aiInsights.inventory && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-mint1 p-3 text-xs leading-5 text-primary"
            >
              {aiInsights.inventory.aiExplanation ||
                "AI explanation is unavailable; the recorded inventory data above remains available."}
              <span className="mt-1 block text-[10px] text-on-surface-variant">
                Supplementary explanation only; recorded inventory values above
                are authoritative.
              </span>
            </p>
          )}
          {insightMutation.isError &&
            insightMutation.variables?.kind === "inventory" && (
              <p role="alert" className="mt-2 text-xs text-error">
                {insightMutation.error.message}
              </p>
            )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-outline">
                Estimated financial impact
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {assessment
                  ? money(assessment.calculation.estimatedRevenueLossKes)
                  : "Not calculated"}
              </p>
            </div>
            <Wallet className="h-6 w-6 text-secondary" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Potential revenue loss estimate for the entered period and
            production-reduction assumption. Not a guarantee.
          </p>
          {assessment && (
            <p className="mt-3 border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
              Additional feed cost estimate:{" "}
              <strong>{money(assessment.calculation.extraFeedCostKes)}</strong>
            </p>
          )}
        </Card>
      </section>

      <Card className="p-5 md:p-6">
        <CardHeader>
          <CardTitle>Estimate feed deficit and financial impact</CardTitle>
          <p className="mt-1 text-sm text-on-surface-variant">
            Enter quantities in kg of dry matter for the selected period. The
            milk production reduction is your scenario assumption.
          </p>
        </CardHeader>
        <form
          onSubmit={calculate}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          noValidate
        >
          <Input
            id="availableFeedKg"
            name="availableFeedKg"
            label="Usable feed available (kg dry matter)"
            type="number"
            min="0"
            step="0.01"
            required
            value={inputs.availableFeedKg}
            onChange={change}
            error={localErrors.availableFeedKg || fieldErrors.availableFeedKg}
          />
          <Input
            id="requiredFeedKg"
            name="requiredFeedKg"
            label="Feed required (kg dry matter)"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={inputs.requiredFeedKg}
            onChange={change}
            error={localErrors.requiredFeedKg || fieldErrors.requiredFeedKg}
          />
          <Input
            id="periodDays"
            name="periodDays"
            label="Selected period (days)"
            type="number"
            min="1"
            max="365"
            step="1"
            required
            value={inputs.periodDays}
            onChange={change}
            error={fieldErrors.periodDays}
          />
          <Input
            id="feedPricePerKgKes"
            name="feedPricePerKgKes"
            label="Feed price (KES per kg dry matter)"
            type="number"
            min="0"
            step="0.01"
            required
            value={inputs.feedPricePerKgKes}
            onChange={change}
            error={
              localErrors.feedPricePerKgKes || fieldErrors.feedPricePerKgKes
            }
          />
          <Input
            id="productionReductionPercent"
            name="productionReductionPercent"
            label="Production reduction assumption (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            required
            value={inputs.productionReductionPercent}
            onChange={change}
            error={
              localErrors.productionReductionPercent ||
              fieldErrors.productionReductionPercent
            }
          />
          {fieldErrors.averageDailyMilkLitres && (
            <p role="alert" className="sm:col-span-2 text-sm text-error">
              {fieldErrors.averageDailyMilkLitres}
            </p>
          )}
          {fieldErrors.milkPricePerLitreKes && (
            <p role="alert" className="sm:col-span-2 text-sm text-error">
              {fieldErrors.milkPricePerLitreKes}
            </p>
          )}
          {assessmentMutation.isError && !Object.keys(fieldErrors).length && (
            <p role="alert" className="sm:col-span-2 text-sm text-error">
              {assessmentMutation.error.message}
            </p>
          )}
          <div className="flex items-end">
            <Button
              type="submit"
              variant="brand"
              loading={assessmentMutation.isPending}
              className="w-full"
            >
              Calculate estimate
            </Button>
          </div>
        </form>
      </Card>

      {assessment && (
        <section
          className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          aria-live="polite"
        >
          <Card className="p-5">
            <h2 className="font-title-lg text-title-lg font-bold text-primary">
              Calculation results
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Feed deficit</dt>
                <dd className="font-semibold">
                  {assessment.calculation.feedDeficitKg} kg dry matter
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Additional feed cost estimate</dt>
                <dd className="font-semibold">
                  {money(assessment.calculation.extraFeedCostKes)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Baseline milk revenue estimate</dt>
                <dd className="font-semibold">
                  {money(assessment.calculation.baselineRevenueKes)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Scenario milk revenue estimate</dt>
                <dd className="font-semibold">
                  {money(assessment.calculation.scenarioRevenueKes)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-outline-variant/40 pt-3">
                <dt>Potential revenue loss estimate</dt>
                <dd className="font-bold">
                  {money(assessment.calculation.estimatedRevenueLossKes)}
                </dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="font-title-lg text-title-lg font-bold text-primary">
              Recommended actions
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
              {assessment.recommendedActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-5 font-semibold text-primary">Assumptions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-on-surface-variant">
              {assessment.financialAssumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </section>
      )}
      <Card className="p-5">
        <h2 className="font-title-md text-title-md font-bold text-primary">
          Risk and estimate assumptions
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-on-surface-variant">
          {farm.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
