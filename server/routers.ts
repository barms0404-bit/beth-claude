import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getMarketSnapshot, getStockQuote } from "./marketData";
import { sendReport } from "./emailService";
import { generateSpecialistResearch, generateAllResearch, getAvailableSpecialists } from "./aiResearch";
import { logRecommendation, closeRecommendation, logAgentRun, getSpecialistStats, getRecentRuns, getActiveRecommendations } from "./performanceTracker";
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
        
        // Log the agent run
        if (result) {
          try {
            await logAgentRun({
              specialistSlug: input.slug,
              specialistName: result.name,
              runType: "manual",
              status: result.research.includes("temporarily unavailable") ? "failed" : "success",
              durationMs: Date.now() - startTime,
              researchPreview: result.research.slice(0, 500),
            });
          } catch { /* non-critical */ }
        }
        
        return result;
      }),

    // Run ALL agents at once
    runAll: publicProcedure.mutation(async () => {
      const startTime = Date.now();
      const results = await generateAllResearch();
      const slugs = Object.keys(results);
      
      // Log all runs
      for (const slug of slugs) {
        const r = results[slug];
        if (r) {
          try {
            await logAgentRun({
              specialistSlug: slug,
              specialistName: r.name,
              runType: "batch",
              status: r.research?.includes("temporarily unavailable") ? "failed" : "success",
              durationMs: Math.round((Date.now() - startTime) / slugs.length),
              researchPreview: r.research?.slice(0, 500) || "",
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

  performance: router({
    // Get all specialist stats
    stats: publicProcedure.query(async () => {
      return await getSpecialistStats();
    }),

    // Get stats for one specialist
    specialist: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getSpecialistStats(input.slug);
      }),

    // Get recent agent runs
    runs: publicProcedure.query(async () => {
      return await getRecentRuns();
    }),

    // Get active recommendations
    recommendations: publicProcedure.query(async () => {
      return await getActiveRecommendations();
    }),

    // Log a new recommendation
    logRec: publicProcedure
      .input(z.object({
        specialistSlug: z.string(),
        specialistName: z.string(),
        ticker: z.string(),
        action: z.string(),
        conviction: z.number(),
        priceAtRec: z.number(),
        priceTarget: z.string().optional(),
        timeHorizon: z.string().optional(),
        thesis: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await logRecommendation(input);
      }),

    // Close a recommendation
    closeRec: publicProcedure
      .input(z.object({ id: z.number(), currentPrice: z.number() }))
      .mutation(async ({ input }) => {
        return await closeRecommendation(input.id, input.currentPrice);
      }),
  }),
});

export type AppRouter = typeof appRouter;
