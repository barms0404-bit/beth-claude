import { describe, expect, it } from "vitest";

describe("OpenAI API Key Validation", () => {
  it("should have a valid OpenAI API key", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("sk-")).toBe(true);

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status).not.toBe(401);
  });
});

describe("Gemini API Key Validation", () => {
  it("should have a valid Gemini API key", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("AIza")).toBe(true);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    expect(response.status).toBe(200);
  });
});
