import { describe, expect, it } from "vitest";
import { validateWebhookUrl } from "../webhooks";

describe("webhook target policy", () => {
  it("normalizes a public HTTPS target", () => {
    expect(validateWebhookUrl(" https://hooks.example.com/events#fragment "))
      .toBe("https://hooks.example.com/events");
  });

  it.each([
    "http://hooks.example.com/events",
    "https://localhost/events",
    "https://127.0.0.1/events",
    "https://10.0.0.2/events",
    "https://user:password@hooks.example.com/events",
    "https://hooks.example.com:8443/events",
  ])("rejects unsafe target %s", (url) => {
    expect(() => validateWebhookUrl(url)).toThrow(/Webhook URL/);
  });
});
