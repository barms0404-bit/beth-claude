/**
 * Email Report Service — Resend Integration
 * Sends automated reports to barms04@yahoo.com at scheduled times
 */

import { getMarketSnapshot } from "./marketData";

const RESEND_API_URL = "https://api.resend.com/emails";
// Resend requires verified domain or sending to own email
// Using verified email until custom domain is set up
const RECIPIENT = "barms0404@gmail.com";

export async function sendReport(reportType: "morning" | "midday" | "close") {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");

  // Get live market data
  const market = await getMarketSnapshot();

  const subjects: Record<string, string> = {
    morning: `AA Research | Morning Prep | ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    midday: `AA Research | Mid-Day Tactical | ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    close: `AA Research | Close & Tomorrow Setup | ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
  };

  // Build market summary
  const quoteSummary = market.quotes.slice(0, 10).map(q =>
    `${q.ticker}: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`
  ).join("\n");

  const econSummary = market.economic.map(e =>
    `${e.series}: ${e.value}% (as of ${e.date})`
  ).join("\n");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${subjects[reportType]}</title></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Georgia,serif;color:#F5E6C8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:32px 0;">
  <tr><td align="center">
    <div style="color:#C9A961;font-size:24px;letter-spacing:4px;font-weight:600;">ARMSTRONG ARIKAT</div>
    <div style="height:2px;background-color:#C9A961;width:200px;margin:12px auto;"></div>
    <div style="color:#8A7548;font-size:11px;letter-spacing:6px;">RESEARCH TERMINAL</div>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;padding:20px;">
  <tr><td>
    <h2 style="color:#C9A961;font-size:20px;margin:0 0 16px;">${reportType === "morning" ? "Morning Market Prep" : reportType === "midday" ? "Mid-Day Tactical Update" : "Market Close & Tomorrow Setup"}</h2>
    
    <div style="background:#0A0A0A;border:1px solid #1F1A0F;border-radius:8px;padding:16px;margin-bottom:20px;">
      <h3 style="color:#C9A961;font-size:14px;margin:0 0 12px;letter-spacing:2px;">MARKET SNAPSHOT</h3>
      <pre style="color:#F5E6C8;font-size:13px;line-height:1.8;margin:0;font-family:monospace;">${quoteSummary || "Markets closed — data unavailable"}</pre>
    </div>

    <div style="background:#0A0A0A;border:1px solid #1F1A0F;border-radius:8px;padding:16px;margin-bottom:20px;">
      <h3 style="color:#C9A961;font-size:14px;margin:0 0 12px;letter-spacing:2px;">TREASURY YIELDS (FRED)</h3>
      <pre style="color:#F5E6C8;font-size:13px;line-height:1.8;margin:0;font-family:monospace;">${econSummary || "Economic data unavailable"}</pre>
    </div>

    <div style="background:#0A0A0A;border:1px solid #1F1A0F;border-radius:8px;padding:16px;margin-bottom:20px;">
      <h3 style="color:#C9A961;font-size:14px;margin:0 0 12px;letter-spacing:2px;">DASHBOARD</h3>
      <p style="color:#F5E6C8;font-size:13px;margin:0;">View full research and analyst pages at:<br>
      <a href="https://armstrongrt-qkf2q886.manus.space" style="color:#C9A961;">armstrongrt-qkf2q886.manus.space</a></p>
    </div>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;border-top:1px solid #1F1A0F;">
  <tr><td align="center">
    <p style="color:#8A7548;font-size:11px;max-width:600px;margin:0 auto;line-height:1.6;">
      This report is prepared by Armstrong Arikat Private Wealth Group for internal portfolio management purposes.
      Not investment advice for third parties. All recommendations subject to verification.
      Past performance does not indicate future results.<br><br>
      Generated: ${new Date().toISOString()} | Source: Polygon.io + FRED
    </p>
  </td></tr>
</table>
</body>
</html>`;

  // Send via Resend
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Armstrong Arikat Research <onboarding@resend.dev>",
      to: [RECIPIENT],
      subject: subjects[reportType],
      html: htmlContent,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error("Resend error:", result);
    throw new Error(`Email send failed: ${JSON.stringify(result)}`);
  }

  return { success: true, id: result.id, reportType, timestamp: new Date().toISOString() };
}
