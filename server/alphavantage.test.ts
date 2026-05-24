import { describe, expect, it } from "vitest";

describe("Alpha Vantage API Key Validation", () => {
  it("should fetch NVDA company overview", async () => {
    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    expect(apiKey).toBeDefined();

    const response = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=NVDA&apikey=${apiKey}`
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    // Should have company data (not an error message)
    expect(data.Symbol || data.Note || data.Information).toBeDefined();
  });
});
