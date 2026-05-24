import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getMarketSnapshot, getStockQuote } from "./marketData";
import { sendReport } from "./emailService";
import { generateSpecialistResearch, generateAllResearch, getAvailableSpecialists } from "./aiResearch";
import { logRecommendationSupabase, closeRecommendationSupabase, getActiveRecommendationsSupabase, getSpecialistPerformanceSupabase, logAgentRunSupabase, getRecentRunsSupabase, SUPABASE_CONFIG } from "./supabaseClient";
import { getCryptoData, getCryptoFearGreed } from "./dataSources";
import { runBacktest, getHindsightSummary, getSpecialistLessons } from "./learningEngine";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  market: router({
    snapshot: publicProcedure.query(async () => {
      return await getMarketSnapshot();
    }),
    quote: publicProcedure
      .input(z.object({ ticker: z.string() }))
      .query(async ({ input }) => {
        return await getStockQuote(input.ticker);
      }),
  }),

  reports: router({
    send: publicProcedure
      .input(z.object({ type: z.enum(["morning", "midday", "close"]) }))
      .mutation(async ({ input }) => {
        return await sendReport(input.type);
      }),
  }),

  research: router({
    specialist: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const startTime = Date.now();
        const result = await generateSpecialistResearch(input.slug);
        
        // Log the agent run to Supabase
        if (result) {
          try {
            await logAgentRunSupabase({
              specialist_slug: input.slug,
              specialist_name: result.name,
              run_type: "manual",
              status: result.research.includes("temporarily unavailable") ? "failed" : "success",
              duration_ms: Date.now() - startTime,
              research_preview: result.research.slice(0, 500),
              model_used: result.model || "manus",
            });
          } catch { /* non-critical */ }
        }
        
        return result;
      }),

    runAll: publicProcedure.mutation(async () => {
      const startTime = Date.now();
      const results = await generateAllResearch();
      const slugs = Object.keys(results);
      
      // Log all runs to Supabase
      for (const slug of slugs) {
        const r = results[slug];
        if (r) {
          try {
            await logAgentRunSupabase({
              specialist_slug: slug,
              specialist_name: r.name,
              run_type: "batch",
              status: r.research?.includes("temporarily unavailable") ? "failed" : "success",
              duration_ms: Math.round((Date.now() - startTime) / slugs.length),
              research_preview: r.research?.slice(0, 500) || "",
              model_used: r.model || "manus",
            });
          } catch { /* non-critical */ }
        }
      }

      return {
        totalAgents: slugs.length,
        successful: slugs.filter(s => results[s]?.research && !results[s].research.includes("temporarily unavailable")).length,
        failed: slugs.filter(s => !results[s]?.research || results[s].research.includes("temporarily unavailable")).length,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        results,
      };
    }),

    available: publicProcedure.query(() => {
      return getAvailableSpecialists();
    }),
  }),

  // Live crypto and enriched data
  data: router({
    crypto: publicProcedure.query(async () => {
      const [prices, fearGreed] = await Promise.all([getCryptoData(), getCryptoFearGreed()]);
      return { prices, fearGreed };
    }),
  }),

  // Learning engine — backtesting, hindsight, lessons
  learning: router({
    // Run backtesting on all active recommendations
    backtest: publicProcedure.mutation(async () => {
      return await runBacktest();
    }),

    // Get hindsight journal for a specialist
    hindsight: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getHindsightSummary(input.slug);
      }),

    // Get accumulated lessons for a specialist
    lessons: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getSpecialistLessons(input.slug);
      }),
  }),

  performance: router({
    // Get all specialist stats from Supabase
    stats: publicProcedure.query(async () => {
      return await getSpecialistPerformanceSupabase() || [];
    }),

    // Get recent agent runs from Supabase
    runs: publicProcedure.query(async () => {
      return await getRecentRunsSupabase() || [];
    }),

    // Get active recommendations from Supabase
    recommendations: publicProcedure.query(async () => {
      return await getActiveRecommendationsSupabase() || [];
    }),

    // Log a new recommendation to Supabase
    logRec: publicProcedure
      .input(z.object({
        specialist_slug: z.string(),
        specialist_name: z.string(),
        ticker: z.string(),
        action: z.string(),
        conviction: z.number(),
        price_at_rec: z.number(),
        price_target: z.string().optional(),
        time_horizon: z.string().optional(),
        thesis: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await logRecommendationSupabase(input);
      }),

    // Close a recommendation in Supabase
    closeRec: publicProcedure
      .input(z.object({ id: z.number(), currentPrice: z.number(), originalPrice: z.number(), action: z.string() }))
      .mutation(async ({ input }) => {
        return await closeRecommendationSupabase(input.id, input.currentPrice, input.originalPrice, input.action);
      }),

    // Get Supabase config for frontend real-time subscriptions
    config: publicProcedure.query(() => {
      return SUPABASE_CONFIG;
    }),
  }),
});

export type AppRouter = typeof appRouter;
