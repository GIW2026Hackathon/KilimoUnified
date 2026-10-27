import { USE_MOCKS, request, wait } from "@/lib/api/client";

export async function login({ identifier, password }) {
  if (USE_MOCKS) {
    await wait();
    /* Mock rule: passwords shorter than 6 characters fail, so the error banner can be demonstrated. */
    if (password.length < 6) {
      throw new Error("Invalid M-Pesa phone number or password. 2 attempts remaining.");
    }
    return { user: { name: "Grace Wanjiku" }, token: "mock-token" };
  }
  return request("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
}

export async function registerAccount(values) {
  if (USE_MOCKS) {
    await wait(900);
    return {
      name: values.fullName,
      farmName: values.farmName,
      county: values.county,
      herdSize: values.herdSize,
      phone: values.phone,
    };
  }
  return request("/auth/register", { method: "POST", body: JSON.stringify(values) });
}