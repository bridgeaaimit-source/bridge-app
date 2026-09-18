import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept");

  const whereClause: any = { organizationId: session.organizationId };
  if (dept && dept !== "All") whereClause.dept = dept;

  try {
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { perf: "desc" },
    });

    const promoReady = employees
      .filter((e) => e.level < 5 && e.perf >= 4 && e.perfPrev >= 3 && e.timeInLevel >= 1.5)
      .map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        dept: e.dept,
        level: e.level,
        perf: e.perf,
        perfPrev: e.perfPrev,
        timeInLevel: e.timeInLevel,
        payVsMarket: Math.round((e.ctc / e.market) * 100),
        suggestedHike: e.ctc / e.market < 0.9 ? 22 : e.ctc / e.market < 1.0 ? 18 : 14,
        score: Math.round(e.perf * 11 + e.perfPrev * 6 + e.potential * 9 + e.goals / 10 + (e.timeInLevel >= 2 ? 10 : 5)),
      }));

    const pipWatchlist = employees
      .filter((e) => e.perf === 1 || (e.perf <= 2 && e.perfPrev <= 2 && e.goals < 60))
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

    return NextResponse.json({
      employees,
      promoReady,
      pipWatchlist,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }
}
