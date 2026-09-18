import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.organizationId;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    const employees = await prisma.employee.findMany({
      where: { organizationId },
    });

    const jobs = await prisma.job.findMany({
      where: { organizationId, status: "OPEN" },
    });

    const candidates = await prisma.candidate.findMany({
      where: { organizationId },
    });

    const highRisk = employees.filter((e) => e.flightRiskLevel === "high");
    const medRisk = employees.filter((e) => e.flightRiskLevel === "med");
    const lowRisk = employees.filter((e) => e.flightRiskLevel === "low");

    const totalPayrollMonthly = employees.reduce((sum, e) => sum + e.ctc, 0) / 12;
    const avgDaysToFill = jobs.length > 0 ? Math.round(jobs.reduce((sum, j) => sum + j.daysOpen, 0) / jobs.length) : 38;

    const departmentCounts: Record<string, number> = {};
    employees.forEach((e) => {
      departmentCounts[e.dept] = (departmentCounts[e.dept] || 0) + 1;
    });

    const stages = ["Sourced", "Screening", "Interview", "Offer", "Accepted"];
    const funnel = stages.map((s, idx) => ({
      label: s,
      value: candidates.filter((c) => stages.indexOf(c.stage) >= idx).length,
    }));

    return NextResponse.json({
      organization: org || { name: "Rocket India", legalName: "Rocket India Pvt Ltd", city: "Bengaluru" },
      headcount: employees.length,
      openRolesCount: jobs.length,
      highRiskCount: highRisk.length,
      medRiskCount: medRisk.length,
      lowRiskCount: lowRisk.length,
      payrollMonthlyCr: (totalPayrollMonthly / 100).toFixed(2),
      payrollAnnualLpa: (totalPayrollMonthly * 12).toFixed(1),
      avgTimeToFillDays: avgDaysToFill,
      eNPS: "+18",
      departmentCounts,
      funnel,
      headcountTrend: [
        { q: "Q3 '25", v: 48 },
        { q: "Q4 '25", v: 52 },
        { q: "Q1 '26", v: 58 },
        { q: "Q2 '26", v: 64 },
        { q: "Q3 '26", v: 68 },
        { q: "Q4 '26", v: 73 },
      ],
      highRiskEmployees: highRisk.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        dept: e.dept,
        riskScore: e.flightRiskScore,
        drivers: JSON.parse(e.flightRiskDrivers || "[]"),
      })),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
