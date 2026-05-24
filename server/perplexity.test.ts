import { describe, expect, it } from "vitest";

describe("Perplexity API Key Validation", () => {
  it("should successfully call Perplexity API", async () => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("pplx-")).toBe(true);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: "What is the S&P 500 at today?" }],
        max_tokens: 50,
      }),
    });
    expect(response.status).not.toBe(401);
  });
});
