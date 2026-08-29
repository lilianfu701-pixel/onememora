import { env } from "./env";

/**
 * Minimal PayPal REST client (Orders API v2).
 *
 * No SDK: a client-credentials token plus `fetch` is all the Orders/Capture
 * flow needs. The secret is read lazily so a build without PayPal configured
 * still compiles; callers check `paypalConfigured()` first.
 */

function apiBase(): string {
  return env().PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function paypalConfigured(): boolean {
  const e = env();
  return Boolean(e.PAYPAL_CLIENT_ID && e.PAYPAL_CLIENT_SECRET);
}

async function accessToken(): Promise<string> {
  const e = env();
  if (!e.PAYPAL_CLIENT_ID || !e.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal is not configured");
  }
  const auth = Buffer.from(
    `${e.PAYPAL_CLIENT_ID}:${e.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal token failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal token missing");
  return data.access_token;
}

/** Authenticated JSON request against the PayPal REST API. */
export async function paypalFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ ok: boolean; status: number; data: T }> {
  const token = await accessToken();
  const options: RequestInit = {
    method: init?.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  };
  if (init?.body !== undefined) {
    options.body = JSON.stringify(init.body);
  }
  const res = await fetch(`${apiBase()}${path}`, options);
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}
