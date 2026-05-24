import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, bigint, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Specialist recommendations — tracks every recommendation made by each AI agent
 */
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  specialistSlug: varchar("specialistSlug", { length: 64 }).notNull(),
  specialistName: varchar("specialistName", { length: 128 }).notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(), // STRONG BUY, BUY, HOLD, SELL
  conviction: int("conviction").notNull(), // 1-10
  priceAtRec: float("priceAtRec").notNull(), // price when recommendation was made
  priceTarget: varchar("priceTarget", { length: 64 }),
  timeHorizon: varchar("timeHorizon", { length: 64 }),
  thesis: text("thesis"),
  status: mysqlEnum("status", ["active", "hit", "miss", "expired"]).default("active").notNull(),
  priceAtClose: float("priceAtClose"), // price when position was closed/evaluated
  returnPct: float("returnPct"), // actual return percentage
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

/**
 * Specialist performance — aggregated stats per specialist
 */
export const specialistPerformance = mysqlTable("specialistPerformance", {
  id: int("id").autoincrement().primaryKey(),
  specialistSlug: varchar("specialistSlug", { length: 64 }).notNull().unique(),
  specialistName: varchar("specialistName", { length: 128 }).notNull(),
  totalRecs: int("totalRecs").default(0).notNull(),
  hits: int("hits").default(0).notNull(),
  misses: int("misses").default(0).notNull(),
  hitRate: float("hitRate").default(0), // hits / (hits + misses)
  avgReturn: float("avgReturn").default(0), // average return on closed positions
  bestReturn: float("bestReturn").default(0),
  worstReturn: float("worstReturn").default(0),
  weight: float("weight").default(1.0), // current weighting factor
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type SpecialistPerformance = typeof specialistPerformance.$inferSelect;
export type InsertSpecialistPerformance = typeof specialistPerformance.$inferInsert;

/**
 * Agent run log — tracks every time an agent generates research
 */
export const agentRuns = mysqlTable("agentRuns", {
  id: int("id").autoincrement().primaryKey(),
  specialistSlug: varchar("specialistSlug", { length: 64 }).notNull(),
  specialistName: varchar("specialistName", { length: 128 }).notNull(),
  runType: mysqlEnum("runType", ["manual", "scheduled", "batch"]).default("manual").notNull(),
  status: mysqlEnum("status", ["success", "failed", "timeout"]).default("success").notNull(),
  durationMs: int("durationMs"),
  tokensUsed: int("tokensUsed"),
  researchPreview: text("researchPreview"), // first 500 chars of generated research
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentRun = typeof agentRuns.$inferSelect;
export type InsertAgentRun = typeof agentRuns.$inferInsert;
