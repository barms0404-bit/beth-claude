import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getMarketSnapshot, getStockQuote } from "./marketData";
import { sendReport } from "./emailService";
import { generateSpecialistResearch, generateAllResearch, getAvailableSpecialists } from "./aiResearch";
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
    // Get AI-generated research for a specific specialist
    specialist: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await generateSpecialistResearch(input.slug);
      }),

    // Generate research for all specialists
    all: publicProcedure.query(async () => {
      return await generateAllResearch();
    }),

    // List available specialist slugs
    available: publicProcedure.query(() => {
      return getAvailableSpecialists();
    }),
  }),
});

export type AppRouter = typeof appRouter;
