import { describe, expect, it } from "vitest";

describe("FRED API Key Validation", () => {
  it("should successfully fetch 10Y Treasury yield from FRED", async () => {
    const apiKey = process.env.FRED_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBe(32);

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("observations");
    expect(data.observations.length).toBeGreaterThan(0);
  });
});
