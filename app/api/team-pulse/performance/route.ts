import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";
import { getCached, setCached, CacheKeys } from "@/lib/team-pulse/cache";
import { computePromoScore, computePipCheck } from "@/lib/team-pulse/scoreEngine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept") || "All";

  const cacheKey = CacheKeys.performance(session.organizationId, dept);
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const whereClause: any = { organizationId: session.organizationId };
  if (dept && dept !== "All") whereClause.dept = dept;

  try {
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { perf: "desc" },
    });

    const promoReady = employees
      .filter((e) => computePromoScore(e).eligible)
      .map((e) => {
        const promo = computePromoScore(e);
        return {
          id: e.id,
          name: e.name,
          role: e.role,
          dept: e.dept,
          level: e.level,
          perf: e.perf,
          perfPrev: e.perfPrev,
          timeInLevel: e.timeInLevel,
          payVsMarket: Math.round((e.ctc / Math.max(1, e.market)) * 100),
          suggestedHike: promo.suggestedHike,
          score: promo.score,
        };
      });

    const pipWatchlist = employees
      .filter((e) => computePipCheck(e))
      .map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        dept: e.dept,
        perf: e.perf,
        perfPrev: e.perfPrev,
        goals: e.goals,
        mgrChanges: e.mgrChanges,
        overtime: e.overtime,
        engagement: e.engagement,
      }));

    const result = {
      employees,
      promoReady,
      pipWatchlist,
    };

    setCached(cacheKey, result, 60);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}
