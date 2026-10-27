"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bot, CloudSun, Leaf, Send, Sparkles } from "lucide-react";
import { askFarmAssistant, getFarms, refreshWeather } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";

const SUGGESTED_QUESTIONS = [
  "How much usable feed do I have?",
  "Which feed has the lowest coverage?",
  "How much feed is reserved or unusable?",
  "How many days will my recorded feed last?",
  "What is my current feed shortage risk?",
  "What actions should I consider?",
  "Are there any active alerts?",
  "What does my stored weather forecast say?",
  "Show the forecast rainfall and temperatures",
];

function ErrorNotice({ children }) {
  return (
    <div role="alert" className="alert alert-error rounded-xl text-sm">
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export default function FarmAssistantPage() {
  const [farmId, setFarmId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const farms = useMemo(() => farmsQuery.data || [], [farmsQuery.data]);
  const activeFarmId = farmId || (farms[0] ? String(farms[0].id) : "");
  const activeFarm = farms.find((farm) => String(farm.id) === activeFarmId);
  const askMutation = useMutation({
    mutationFn: ({ selectedFarmId, text }) =>
      askFarmAssistant(selectedFarmId, text),
    onSuccess: (answer, variables) => {
      setMessages((current) => [
        ...current,
        { question: variables.text, answer },
      ]);
      setQuestion("");
      setLocalError("");
    },
  });
  const fieldError =
    askMutation.error instanceof ApiError
      ? askMutation.error.fields.question
      : "";
  const weatherMutation = useMutation({
    mutationFn: refreshWeather,
    onSuccess: (result) => {
      queryClient.setQueryData(["farms"], (current) =>
        current?.map((farm) =>
          farm.id === result.farm.id ? result.farm : farm,
        ),
      );
    },
  });

  useEffect(() => {
    if (farms.length && !farmId) setFarmId(String(farms[0].id));
  }, [farms, farmId]);

  function chooseQuestion(value) {
    setQuestion(value);
    setLocalError("");
    inputRef.current?.focus();
  }

  function submitQuestion(event) {
    event.preventDefault();
    const text = question.trim();
    if (!activeFarmId) return;
    if (!text) {
      setLocalError("Enter a question or choose one of the suggestions.");
      inputRef.current?.focus();
      return;
    }
    if (text.length > 1000) {
      setLocalError("Questions must be 1000 characters or fewer.");
      return;
    }
    setLocalError("");
    askMutation.mutate({ selectedFarmId: activeFarmId, text });
  }

  if (farmsQuery.isPending) {
    return (
      <div className="space-y-4" aria-label="Loading farm assistant">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (farmsQuery.isError) {
    return (
      <ErrorNotice>
        {farmsQuery.error.message}{" "}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => farmsQuery.refetch()}
        >
          Try again
        </button>
      </ErrorNotice>
    );
  }

  if (!farms.length) {
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center md:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint1 text-primary">
          <Bot className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mt-5 font-headline-xl text-headline-xl-mobile font-bold text-primary md:text-headline-xl">
          Your farm assistant is ready
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
          Add a farm profile first. The assistant uses your farm’s recorded feed
          inventory, stored forecast, risk assessment, and alerts to answer
          questions.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-primary to-deepForest p-6 text-white shadow-lg md:p-8">
        <div
          className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[32px] border-white/5"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-lime">
              <Sparkles className="h-4 w-4" aria-hidden /> Farm data, made
              useful
            </p>
            <h1 className="mt-3 font-headline-xl text-headline-xl-mobile font-bold md:text-headline-xl">
              Ask about your farm
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
              Get practical answers grounded in what you have recorded. Every
              response is tied to the selected farm’s latest saved inventory,
              forecast, risk, and alerts.
            </p>
          </div>
          <label className="relative z-10 block w-full md:max-w-xs">
            <span className="mb-2 block text-xs font-semibold text-white/80">
              Farm to ask about
            </span>
            <select
              className="select select-bordered w-full bg-white text-on-surface"
              value={activeFarmId}
              onChange={(event) => {
                setFarmId(event.target.value);
                setMessages([]);
                askMutation.reset();
              }}
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} · {farm.county || farm.location}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {activeFarm && (
        <section
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          aria-label="Selected farm context"
        >
          <div className="interactive-card rounded-xl border border-line bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-outline">
              <Leaf className="h-4 w-4 text-secondary" aria-hidden /> Feed
              status
            </div>
            <p className="mt-2 text-lg font-bold text-primary">
              {activeFarm.feedStatus}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {activeFarm.feedItems.length
                ? `${activeFarm.feedItems.length} feed type${activeFarm.feedItems.length === 1 ? "" : "s"} recorded`
                : "No feed inventory recorded"}
            </p>
          </div>
          <div className="interactive-card rounded-xl border border-line bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-outline">
              <CloudSun className="h-4 w-4 text-secondary" aria-hidden /> Stored
              forecast
            </div>
            <p className="mt-2 text-lg font-bold text-primary">
              {activeFarm.climateRisk.status.toLowerCase().replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {activeFarm.climateRisk.indicators.length} dated indicator
              {activeFarm.climateRisk.indicators.length === 1 ? "" : "s"}{" "}
              available
            </p>
            <button
              type="button"
              className="btn btn-sm btn-outline mt-3 min-h-9 border-lineStrong text-primary"
              onClick={() => weatherMutation.mutate(activeFarm.id)}
              disabled={weatherMutation.isPending}
            >
              {weatherMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <CloudSun className="h-4 w-4" aria-hidden />
              )}
              {weatherMutation.isPending ? "Refreshing…" : "Refresh forecast"}
            </button>
            {weatherMutation.data?.weatherRefresh.fallback && (
              <p role="status" className="mt-2 text-xs text-warning">
                {weatherMutation.data.weatherRefresh.fallback}
              </p>
            )}
            {weatherMutation.isError && (
              <p role="alert" className="mt-2 text-xs text-error">
                {weatherMutation.error.message}
              </p>
            )}
          </div>
          <div className="interactive-card rounded-xl border border-line bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-outline">
              <Bot className="h-4 w-4 text-secondary" aria-hidden /> Farm
              profile
            </div>
            <p className="mt-2 truncate text-lg font-bold text-primary">
              {activeFarm.name}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {activeFarm.location}
              {activeFarm.county ? `, ${activeFarm.county} County` : ""}
            </p>
          </div>
        </section>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4 md:px-7">
          <div>
            <h2 className="font-title-lg text-title-lg font-bold text-primary">
              Farm conversation
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Answers refresh from saved farm records each time you ask.
            </p>
          </div>
          <span className="badge badge-success badge-outline gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Data
            connected
          </span>
        </div>

        <div
          className="max-h-[55vh] min-h-64 space-y-5 overflow-y-auto bg-surface-container-low/60 p-4 md:p-7"
          aria-live="polite"
          aria-label="Assistant conversation"
        >
          {!messages.length && (
            <div className="mx-auto flex min-h-52 max-w-lg flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint1 text-primary">
                <Bot className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-3 font-semibold text-primary">
                What would you like to know?
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Choose a prompt below to fill the message box, or ask your own
                question.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${index}-${message.question}`} className="space-y-3">
              <div className="chat chat-end">
                <div className="chat-bubble chat-bubble-primary max-w-[90%] break-words md:max-w-[75%]">
                  {message.question}
                </div>
              </div>
              <div className="chat chat-start">
                <div className="chat-image avatar placeholder">
                  <div className="w-9 rounded-full bg-mint1 text-primary">
                    <Bot className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <div className="max-w-[95%] space-y-2 md:max-w-[80%]">
                  <div className="chat-bubble chat-bubble-neutral whitespace-pre-line">
                    {message.answer.answer}
                  </div>
                  {message.answer.aiExplanation && (
                    <div className="rounded-xl border border-line bg-mint1/70 px-4 py-3 text-sm text-primary">
                      <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden /> Helpful
                        explanation
                      </span>
                      {message.answer.aiExplanation}
                    </div>
                  )}
                  {(message.answer.topic === "inventory" ||
                    message.answer.topic === "coverage") && (
                    <div className="rounded-xl border border-line bg-white p-3 text-sm">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                        Recorded feed inventory
                      </p>
                      {message.answer.evidence.inventory.length ? (
                        <ul className="space-y-2">
                          {message.answer.evidence.inventory.map((item) => (
                            <li
                              key={item.feedType}
                              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0"
                            >
                              <strong className="text-primary">
                                {item.feedType}
                              </strong>
                              <span>
                                {item.usableStockKg} kg usable ·{" "}
                                {item.coverageDays ?? "unknown"} days ·{" "}
                                {item.inventoryRiskLevel} risk
                              </span>
                              <span className="w-full text-xs text-on-surface-variant">
                                {item.stockKg} kg stock ·{" "}
                                {item.dailyConsumptionKg ?? "unknown"} kg daily
                                use
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-on-surface-variant">
                          No feed inventory is recorded for this farm.
                        </p>
                      )}
                    </div>
                  )}
                  {message.answer.topic === "weather" && (
                    <div className="rounded-xl border border-line bg-white p-3 text-sm">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                        Stored forecast details ·{" "}
                        {message.answer.evidence.weather.status
                          .toLowerCase()
                          .replaceAll("_", " ")}
                      </p>
                      {message.answer.evidence.weather.indicators.length ? (
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {message.answer.evidence.weather.indicators.map(
                            (day) => (
                              <li
                                key={day.date}
                                className="rounded-lg bg-surface-container-low p-2 text-xs"
                              >
                                <strong>{day.date}</strong>
                                {day.freshness
                                  ? ` · ${day.freshness.toLowerCase()}`
                                  : ""}
                                <br />
                                Rain: {day.precipitationMm ?? "unknown"} mm ·
                                Temperature: {day.temperatureMinC ?? "?"}–
                                {day.temperatureMaxC ?? "?"} °C
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="text-xs text-on-surface-variant">
                          No usable dated forecast is stored yet. Refresh the
                          forecast after adding farm coordinates.
                        </p>
                      )}
                      <p className="mt-2 text-[11px]] text-on-surface-variant">
                        Forecast information is contextual; it does not confirm
                        pasture conditions or feed availability.
                      </p>
                    </div>
                  )}
                  <p className="px-2 text-xs text-on-surface-variant">
                    {message.answer.evidence.riskLevel} recorded risk ·{" "}
                    {message.answer.evidence.inventory.length} feed records ·{" "}
                    {message.answer.evidence.alerts.length} active/acknowledged
                    alerts
                  </p>
                </div>
              </div>
            </div>
          ))}
          {askMutation.isPending && (
            <div
              className="chat chat-start"
              aria-label="Assistant is checking farm records"
            >
              <div className="chat-image avatar placeholder">
                <div className="w-9 rounded-full bg-mint1 text-primary">
                  <Bot className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <div className="chat-bubble chat-bubble-neutral">
                <span className="loading loading-dots loading-sm" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant/50 p-4 md:p-6">
          <p className="mb-2 text-xs font-semibold text-on-surface-variant">
            Suggested questions{" "}
            <span className="font-normal">(tap to fill the message box)</span>
          </p>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {SUGGESTED_QUESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => chooseQuestion(item)}
                className="btn btn-sm btn-outline h-auto min-h-9 shrink-0 whitespace-nowrap rounded-full border-lineStrong text-primary hover:border-primary hover:bg-mint1"
              >
                {item}
              </button>
            ))}
          </div>
          <form onSubmit={submitQuestion} className="space-y-2">
            <label htmlFor="assistant-question" className="sr-only">
              Ask a question about this farm
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="assistant-question"
                ref={inputRef}
                className="textarea textarea-bordered min-h-14 flex-1 resize-y rounded-xl border-outline-variant bg-surface text-sm focus:border-secondary"
                rows={2}
                maxLength={1000}
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  setLocalError("");
                  askMutation.reset();
                }}
                placeholder="Ask about feed, coverage, your risk, alerts, or the stored forecast…"
                aria-describedby="assistant-note assistant-error"
              />
              <button
                type="submit"
                className="btn btn-primary min-h-14 rounded-xl px-5"
                disabled={askMutation.isPending}
                aria-label="Send question"
              >
                {askMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                <span className="hidden sm:inline">Ask</span>
              </button>
            </div>
            {(localError || fieldError) && (
              <p
                id="assistant-error"
                role="alert"
                className="text-xs text-error"
              >
                {localError || fieldError}
              </p>
            )}
            {askMutation.isError && !fieldError && (
              <p role="alert" className="text-xs text-error">
                {askMutation.error.message} Please try again.
              </p>
            )}
            <p
              id="assistant-note"
              className="text-[11px] text-on-surface-variant"
            >
              Answers use recorded information and are estimates, not veterinary
              advice or guarantees. Missing records may limit what the assistant
              can confirm.
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}
