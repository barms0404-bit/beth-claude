/**
 * Specialist Performance Tracking Service
 * Logs recommendations, tracks hit rates, and manages agent run history
 */

import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { recommendations, specialistPerformance, agentRuns } from "../drizzle/schema";
import type { InsertRecommendation, InsertAgentRun } from "../drizzle/schema";

export async function logRecommendation(rec: Omit<InsertRecommendation, "id" | "createdAt" | "status">) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(recommendations).values({
    ...rec,
    status: "active",
  }).$returningId();

  // Update specialist total recs count
  await updateSpecialistStats(rec.specialistSlug, rec.specialistName);

  return result;
}

export async function closeRecommendation(id: number, currentPrice: number) {
  const db = await getDb();
  if (!db) return null;

  // Get the original recommendation
  const [rec] = await db.select().from(recommendations).where(eq(recommendations.id, id)).limit(1);
  if (!rec) return null;

  const returnPct = ((currentPrice - rec.priceAtRec) / rec.priceAtRec) * 100;
  const isHit = (rec.action.includes("BUY") && returnPct > 0) || (rec.action === "SELL" && returnPct < 0);

  await db.update(recommendations).set({
    status: isHit ? "hit" : "miss",
    priceAtClose: currentPrice,
    returnPct: Math.round(returnPct * 100) / 100,
    closedAt: new Date(),
  }).where(eq(recommendations.id, id));

  // Update specialist stats
  await updateSpecialistStats(rec.specialistSlug, rec.specialistName);

  return { id, returnPct, status: isHit ? "hit" : "miss" };
}

export async function logAgentRun(run: Omit<InsertAgentRun, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(agentRuns).values(run).$returningId();
  return result;
}

export async function updateSpecialistStats(slug: string, name: string) {
  const db = await getDb();
  if (!db) return;

  // Calculate stats from recommendations
  const allRecs = await db.select().from(recommendations).where(eq(recommendations.specialistSlug, slug));
  
  const closedRecs = allRecs.filter(r => r.status === "hit" || r.status === "miss");
  const hits = closedRecs.filter(r => r.status === "hit").length;
  const misses = closedRecs.filter(r => r.status === "miss").length;
  const hitRate = closedRecs.length > 0 ? hits / closedRecs.length : 0;
  const returns = closedRecs.filter(r => r.returnPct !== null).map(r => r.returnPct!);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const bestReturn = returns.length > 0 ? Math.max(...returns) : 0;
  const worstReturn = returns.length > 0 ? Math.min(...returns) : 0;

  // Calculate weight based on hit rate (1.0 baseline, max 2.0, min 0.5)
  const weight = Math.max(0.5, Math.min(2.0, 0.5 + hitRate * 1.5));

  // Upsert specialist performance
  await db.insert(specialistPerformance).values({
    specialistSlug: slug,
    specialistName: name,
    totalRecs: allRecs.length,
    hits,
    misses,
    hitRate: Math.round(hitRate * 100) / 100,
    avgReturn: Math.round(avgReturn * 100) / 100,
    bestReturn: Math.round(bestReturn * 100) / 100,
    worstReturn: Math.round(worstReturn * 100) / 100,
    weight: Math.round(weight * 100) / 100,
  }).onDuplicateKeyUpdate({
    set: {
      totalRecs: allRecs.length,
      hits,
      misses,
      hitRate: Math.round(hitRate * 100) / 100,
      avgReturn: Math.round(avgReturn * 100) / 100,
      bestReturn: Math.round(bestReturn * 100) / 100,
      worstReturn: Math.round(worstReturn * 100) / 100,
      weight: Math.round(weight * 100) / 100,
    },
  });
}

export async function getSpecialistStats(slug?: string) {
  const db = await getDb();
  if (!db) return [];

  if (slug) {
    return await db.select().from(specialistPerformance).where(eq(specialistPerformance.specialistSlug, slug));
  }
  return await db.select().from(specialistPerformance).orderBy(desc(specialistPerformance.hitRate));
}

export async function getRecentRuns(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(agentRuns).orderBy(desc(agentRuns.createdAt)).limit(limit);
}

export async function getActiveRecommendations(slug?: string) {
  const db = await getDb();
  if (!db) return [];

  if (slug) {
    return await db.select().from(recommendations)
      .where(eq(recommendations.specialistSlug, slug))
      .orderBy(desc(recommendations.createdAt)).limit(20);
  }
  return await db.select().from(recommendations)
    .where(eq(recommendations.status, "active"))
    .orderBy(desc(recommendations.createdAt)).limit(50);
}
