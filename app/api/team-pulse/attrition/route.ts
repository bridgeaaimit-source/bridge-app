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
  const level = searchParams.get("level");

  const whereClause: any = { organizationId: session.organizationId };
  if (dept && dept !== "All") whereClause.dept = dept;
  if (level && level !== "All") whereClause.flightRiskLevel = level;

  try {
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { flightRiskScore: "desc" },
    });

    const parsed = employees.map((e) => {
      const drivers = JSON.parse(e.flightRiskDrivers || "[]");
      const replCostLpa = e.ctc * (e.level <= 2 ? 0.5 : e.level === 3 ? 0.75 : 1.0);
      const fixPayCost = Math.max(0, e.market * 0.95 - e.ctc);

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
        riskScore: e.flightRiskScore,
        riskLevel: e.flightRiskLevel,
        drivers,
        replCostLpa: Math.round(replCostLpa * 10) / 10,
        fixPayCostLpa: Math.round(fixPayCost * 10) / 10,
      };
    });

    const highRiskCount = parsed.filter((e) => e.riskLevel === "high").length;
    const totalReplCost = parsed
      .filter((e) => e.riskLevel === "high")
      .reduce((sum, e) => sum + e.replCostLpa, 0);

    return NextResponse.json({
      employees: parsed,
      highRiskCount,
      totalReplCostLpa: Math.round(totalReplCost * 10) / 10,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attrition radar data" }, { status: 500 });
  }
}
