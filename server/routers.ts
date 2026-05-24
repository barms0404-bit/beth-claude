import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getMarketSnapshot, getStockQuote } from "./marketData";
import { sendReport } from "./emailService";
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
    // Get full market snapshot (all indices + top stocks + economic data)
    snapshot: publicProcedure.query(async () => {
      return await getMarketSnapshot();
    }),

    // Get single stock quote
    quote: publicProcedure
      .input(z.object({ ticker: z.string() }))
      .query(async ({ input }) => {
        return await getStockQuote(input.ticker);
      }),
  }),

  reports: router({
    // Manually trigger a report send
    send: publicProcedure
      .input(z.object({ type: z.enum(["morning", "midday", "close"]) }))
      .mutation(async ({ input }) => {
        return await sendReport(input.type);
      }),
  }),
});

export type AppRouter = typeof appRouter;
