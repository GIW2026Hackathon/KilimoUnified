import { API_BASE_URL, USE_MOCKS } from "@/lib/constants";

export { USE_MOCKS };

export const wait = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}