import { beforeEach, describe, expect, it, vi } from "vitest";

const config: Record<string, string | undefined> = {};

vi.mock("@/lib/env", () => ({ env: () => config }));

const { availablePaymentProviders } = await import("@/lib/payment-providers");

describe("availablePaymentProviders", () => {
  beforeEach(() => {
    for (const key of Object.keys(config)) delete config[key];
  });

  it("is empty when no provider is configured", () => {
    expect(availablePaymentProviders()).toEqual([]);
  });

  it("offers Stripe alone when only its secret is set", () => {
    config.STRIPE_SECRET_KEY = "sk_test_x";
    expect(availablePaymentProviders()).toEqual(["stripe"]);
  });

  it("needs both PayPal credentials before offering PayPal", () => {
    config.PAYPAL_CLIENT_ID = "id";
    expect(availablePaymentProviders()).toEqual([]);
    config.PAYPAL_CLIENT_SECRET = "secret";
    expect(availablePaymentProviders()).toEqual(["paypal"]);
  });

  it("lists Stripe before PayPal when both are configured", () => {
    config.STRIPE_SECRET_KEY = "sk_test_x";
    config.PAYPAL_CLIENT_ID = "id";
    config.PAYPAL_CLIENT_SECRET = "secret";
    expect(availablePaymentProviders()).toEqual(["stripe", "paypal"]);
  });
});
