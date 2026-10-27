export type ApiFieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  code: string;
  fields: ApiFieldErrors;

  constructor(
    message: string,
    status: number,
    code = "request_failed",
    fields: ApiFieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export type User = { id: number; name: string; phone: string | null };
export type ForecastIndicator = {
  date: string;
  precipitationMm: string | null;
  temperatureMinC: string | null;
  temperatureMaxC: string | null;
  fetchedAt: string;
  freshness?: string;
};
export type FeedItem = {
  feedType: string;
  stockKg: string;
  usableStockKg: string;
  dailyConsumptionKg: string | null;
  coverageDays: string | null;
  inventoryRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
};
export type Farm = {
  id: number;
  name: string;
  county: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  herdSize: number | null;
  averageDailyMilkLitres: string | null;
  milkPricePerLitreKes: string | null;
  feedStatus: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  feedItems: FeedItem[];
  climateRisk: {
    level: "LOW" | "MODERATE" | "HIGH" | "UNAVAILABLE";
    status: string;
    assumption: string;
    indicators: ForecastIndicator[];
  };
  assumptions: string[];
  evaluatedAt: string;
};
export type AssessmentInput = {
  availableFeedKg: number;
  requiredFeedKg: number;
  feedPricePerKgKes: number;
  productionReductionPercent: number;
  periodDays: number;
};
export type Assessment = Farm & {
  calculation: {
    periodDays: number;
    availableFeedKg: string;
    requiredFeedKg: string;
    feedDeficitKg: string;
    feedPricePerKgKes: string;
    extraFeedCostKes: string;
    baselineRevenueKes: string;
    productionReductionPercent: string;
    scenarioRevenueKes: string;
    estimatedRevenueLossKes: string;
  };
  financialAssumptions: string[];
  recommendedActions: string[];
};
export type WeatherRefreshResult = {
  farm: Farm;
  weatherRefresh: {
    status: "SUCCESS" | "PARTIAL" | "FAILED" | "SKIPPED";
    reason: string | null;
    fallback: string | null;
  };
};
export type FarmAssistantResult = {
  farmId: number;
  farmName: string;
  topic: string;
  answer: string;
  aiExplanation: string | null;
  aiStatus: string;
  evaluatedAt: string;
  evidence: {
    riskLevel: string;
    inventoryRiskLevel: string;
    inventory: Array<{
      feedType: string;
      stockKg: string;
      usableStockKg: string;
      dailyConsumptionKg: string | null;
      coverageDays: string | null;
      inventoryRiskLevel: string;
    }>;
    weather: {
      status: string;
      indicators: ForecastIndicator[];
      influencesRisk: boolean;
    };
    ruleIds: string[];
    explanation: string;
    recommendedAction: string;
    alerts: Array<{
      level: string;
      status: string;
      message: string;
      recommendedAction: string;
      updatedAt: string;
    }>;
  };
};

declare const process: { env: { NEXT_PUBLIC_API_BASE_URL?: string } };

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");
let csrfToken: string | null = null;

function toSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toSnakeCase);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        toSnakeCase(item),
      ]),
    );
  }
  return value;
}

function toCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toCamelCase);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key.replace(/_([a-z])/g, (_match, letter: string) =>
          letter.toUpperCase(),
        ),
        toCamelCase(item),
      ]),
    );
  }
  return value;
}

async function refreshCsrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/csrf/`, {
    credentials: "include",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.csrf_token !== "string") {
    throw new ApiError(
      "Could not start a secure session with the server.",
      response.status || 500,
    );
  }
  csrfToken = body.csrf_token;
  return body.csrf_token;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRFToken", csrfToken || (await refreshCsrfToken()));
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body?.error || {};
    const rawFields =
      error.fields && typeof error.fields === "object" ? error.fields : {};
    const fields = Object.fromEntries(
      Object.entries(rawFields).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_match, letter: string) =>
          letter.toUpperCase(),
        ),
        Array.isArray(value) ? value.join(" ") : String(value),
      ]),
    );
    throw new ApiError(
      error.message || `Request failed (${response.status}).`,
      response.status,
      error.code,
      fields,
    );
  }
  return toCamelCase(body) as T;
}

function jsonBody(value: unknown): string {
  return JSON.stringify(toSnakeCase(value));
}

export async function login(input: {
  username: string;
  password: string;
}): Promise<{ user: User }> {
  const result = await apiRequest<{ user: User }>("/api/auth/login/", {
    method: "POST",
    body: jsonBody(input),
  });
  csrfToken = null;
  await refreshCsrfToken();
  return result;
}

export async function registerAccount(
  input: Record<string, unknown>,
): Promise<{ user: User; farm: Farm }> {
  const result = await apiRequest<{ user: User; farm: Farm }>(
    "/api/auth/register/",
    { method: "POST", body: jsonBody(input) },
  );
  csrfToken = null;
  await refreshCsrfToken();
  return result;
}

export async function getFarms(): Promise<Farm[]> {
  const result = await apiRequest<{ farms: Farm[] }>("/api/farms/");
  return result.farms;
}

export async function getFarm(id: number | string): Promise<Farm> {
  const result = await apiRequest<{ farm: Farm }>(
    `/api/farms/${encodeURIComponent(id)}/`,
  );
  return result.farm;
}

export async function submitAssessment(
  id: number | string,
  input: AssessmentInput,
): Promise<Assessment> {
  const result = await apiRequest<{ assessment: Assessment }>(
    `/api/farms/${encodeURIComponent(id)}/assessment/`,
    {
      method: "POST",
      body: jsonBody(input),
    },
  );
  return result.assessment;
}

export async function refreshWeather(
  id: number | string,
): Promise<WeatherRefreshResult> {
  return apiRequest<WeatherRefreshResult>(
    `/api/farms/${encodeURIComponent(id)}/weather/refresh/`,
    { method: "POST", body: "{}" },
  );
}

export async function askFarmAssistant(
  farmId: number | string,
  question: string,
): Promise<FarmAssistantResult> {
  const result = await apiRequest<{ assistant: FarmAssistantResult }>(
    "/api/assistant/",
    {
      method: "POST",
      body: jsonBody({ farmId, question }),
    },
  );
  return result.assistant;
}

export async function currentUser(): Promise<User> {
  const result = await apiRequest<{ user: User }>("/api/auth/me/");
  return result.user;
}

export async function logout(): Promise<void> {
  await apiRequest<{ ok: boolean }>("/api/auth/logout/", {
    method: "POST",
    body: "{}",
  });
  csrfToken = null;
}
