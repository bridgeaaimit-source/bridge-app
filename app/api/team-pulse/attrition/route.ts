import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";
import { getCached, setCached, CacheKeys } from "@/lib/team-pulse/cache";
import { computeFlightRisk } from "@/lib/team-pulse/scoreEngine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept") || "All";
  const level = searchParams.get("level") || "All";

  const cacheKey = CacheKeys.attrition(session.organizationId, dept, level);
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const whereClause: any = { organizationId: session.organizationId };
  if (dept && dept !== "All") whereClause.dept = dept;
  if (level && level !== "All") whereClause.flightRiskLevel = level;

  try {
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { flightRiskScore: "desc" },
    });

    const parsed = employees.map((e) => {
      let storedDrivers: string[] = [];
      try {
        storedDrivers = JSON.parse(e.flightRiskDrivers || "[]");
      } catch {}

      const computed = computeFlightRisk(e);
      const drivers = storedDrivers.length > 0 ? storedDrivers : computed.drivers;

      return {
        id: e.id,
        name: e.name,
        role: e.role,
        dept: e.dept,
        level: e.level,
        ctc: e.ctc,
        market: e.market,
        perf: e.perf,
        tenure: e.tenure,
        mbti: e.mbti,
        managerName: e.managerName,
        riskScore: e.flightRiskScore || computed.score,
        riskLevel: e.flightRiskLevel || computed.level,
        drivers,
        replCostLpa: computed.replCostLpa,
        fixPayCostLpa: computed.fixPayCostLpa,
      };
    });

    const highRiskCount = parsed.filter((e) => e.riskLevel === "high").length;
    const totalReplCost = parsed
      .filter((e) => e.riskLevel === "high")
      .reduce((sum, e) => sum + e.replCostLpa, 0);

    const result = {
      employees: parsed,
      highRiskCount,
      totalReplCostLpa: Math.round(totalReplCost * 10) / 10,
    };

    setCached(cacheKey, result, 60);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attrition radar data" },
      { status: 500 }
    );
  }
}
