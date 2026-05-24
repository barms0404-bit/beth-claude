import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Hourly refresh — top 10 specialists during market hours
  app.post("/api/scheduled/hourly-refresh", async (req, res) => {
    try {
      const { generateSpecialistResearch } = await import("../aiResearch");
      const { autoLogFromResearch } = await import("../autoLogger");
      const { logAgentRunSupabase } = await import("../supabaseClient");

      const TOP_10 = [
        "david-park", "marcus-chen", "dr-laura-mitchell", "rachel-kim",
        "elena-vasquez", "michael-torres", "dr-robert-kessler",
        "sarah-nakamura", "andrew-walsh", "sophia-reyes"
      ];

      const results = { success: 0, failed: 0, recsLogged: 0 };

      for (const slug of TOP_10) {
        try {
          const startTime = Date.now();
          const research = await generateSpecialistResearch(slug);
          if (research && !research.research.includes("temporarily unavailable")) {
            results.success++;
            // Auto-log recommendations
            const logged = await autoLogFromResearch(slug, research.name, research.research);
            results.recsLogged += logged;
            // Log the run
            await logAgentRunSupabase({
              specialist_slug: slug,
              specialist_name: research.name,
              run_type: "scheduled" as any,
              status: "success",
              duration_ms: Date.now() - startTime,
              research_preview: research.research.slice(0, 500),
              model_used: (research as any).model || "manus",
            });
          } else {
            results.failed++;
          }
        } catch {
          results.failed++;
        }
      }

      res.json({ ok: true, ...results, agents: TOP_10.length, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Hourly Refresh] Error:", error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
    }
  });

  // Backtesting engine — evaluates all active recommendations
  app.post("/api/scheduled/backtest", async (req, res) => {
    try {
      const { runBacktest } = await import("../learningEngine");
      const results = await runBacktest();
      res.json({ ok: true, ...results, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Backtest] Error:", error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
    }
  });

  // Weekly auto-close expired recommendations (evaluates 30-day-old picks)
  app.post("/api/scheduled/close-expired", async (req, res) => {
    try {
      const { getActiveRecommendationsSupabase, closeRecommendationSupabase } = await import("../supabaseClient");
      const { getStockQuote } = await import("../marketData");
      
      const activeRecs = await getActiveRecommendationsSupabase();
      if (!activeRecs || activeRecs.length === 0) {
        return res.json({ ok: true, message: "No active recommendations to evaluate", closed: 0 });
      }

      let closed = 0;
      const now = new Date();
      
      for (const rec of activeRecs) {
        // Check if recommendation is older than 30 days
        const createdAt = new Date(rec.created_at);
        const daysSinceRec = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceRec >= 30) {
          // Get current price and close the recommendation
          const quote = await getStockQuote(rec.ticker);
          if (quote) {
            await closeRecommendationSupabase(rec.id, quote.price, rec.price_at_rec, rec.action);
            closed++;
          }
        }
      }

      res.json({ ok: true, evaluated: activeRecs.length, closed, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Close Expired] Error:", error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
    }
  });

  // Scheduled report endpoint (called by heartbeat cron)
  app.post("/api/scheduled/report", async (req, res) => {
    try {
      // Allow all calls (cron system and direct)

      const { sendReport } = await import("../emailService");
      const reportType = req.body?.type || "morning";
      const result = await sendReport(reportType);
      res.json({ ok: true, ...result });
    } catch (error: any) {
      console.error("[Scheduled Report] Error:", error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
