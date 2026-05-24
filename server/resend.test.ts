import { describe, expect, it } from "vitest";

describe("Resend API Key Validation", () => {
  it("should have a valid Resend API key format", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("re_")).toBe(true);
    expect(apiKey!.length).toBeGreaterThan(20);

    // Validate by calling Resend API domains endpoint
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    // 200 = valid key, 401 = invalid key
    expect(response.status).not.toBe(401);
  });
});
