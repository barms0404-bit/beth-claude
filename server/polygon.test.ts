import { describe, expect, it } from "vitest";

describe("Polygon API Key Validation", () => {
  it("should successfully fetch market status from Polygon.io", async () => {
    const apiKey = process.env.POLYGON_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);

    const response = await fetch(`https://api.polygon.io/v1/marketstatus/now?apiKey=${apiKey}`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("market");
  });
});
