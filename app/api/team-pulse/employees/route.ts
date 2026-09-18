import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept");
  const riskLevel = searchParams.get("riskLevel");

  const whereClause: any = { organizationId: session.organizationId };
  if (dept && dept !== "All") whereClause.dept = dept;
  if (riskLevel && riskLevel !== "All") whereClause.flightRiskLevel = riskLevel;

  try {
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { flightRiskScore: "desc" },
    });

    const parsed = employees.map((e) => ({
      ...e,
      skills: JSON.parse(e.skills || "[]"),
      prevCompanies: JSON.parse(e.prevCompanies || "[]"),
      trainings: JSON.parse(e.trainings || "{}"),
      documents: JSON.parse(e.documents || "{}"),
      flightRiskDrivers: JSON.parse(e.flightRiskDrivers || "[]"),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newEmp = await prisma.employee.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        email: body.email || `${body.name.toLowerCase().replace(/\s+/g, ".")}@${session.organizationName.toLowerCase().replace(/\s+/g, "")}.com`,
        role: body.role,
        dept: body.dept,
        level: Number(body.level) || 2,
        gender: body.gender || "M",
        age: Number(body.age) || 28,
        ctc: Number(body.ctc) || 15.0,
        market: Number(body.market) || 16.0,
        perf: Number(body.perf) || 3,
        perfPrev: Number(body.perfPrev) || 3,
        potential: Number(body.potential) || 2,
        goals: Number(body.goals) || 80,
        engagement: Number(body.engagement) || 4.0,
        overtime: Number(body.overtime) || 40,
        tenure: Number(body.tenure) || 1.0,
        timeInLevel: Number(body.timeInLevel) || 1.0,
        mbti: body.mbti || "INTJ",
        managerName: body.managerName || "HR Lead",
        skills: JSON.stringify(body.skills || []),
        prevCompanies: JSON.stringify(body.prevCompanies || []),
        trainings: JSON.stringify(body.trainings || { posh: "done", fire: "done", coc: "done", dpdp: "done" }),
        documents: JSON.stringify(body.documents || { PAN: "ok", Aadhaar: "ok", "Bank details": "ok" }),
        flightRiskScore: Number(body.flightRiskScore) || 15.0,
        flightRiskLevel: body.flightRiskLevel || "low",
        flightRiskDrivers: JSON.stringify(body.flightRiskDrivers || []),
      },
    });

    return NextResponse.json(newEmp);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
