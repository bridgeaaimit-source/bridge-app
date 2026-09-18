import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await prisma.workforcePlan.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
    });

    const employees = await prisma.employee.findMany({
      where: { organizationId: session.organizationId },
    });

    const parsedPlans = plans.map((p) => ({
      ...p,
      growthByDept: JSON.parse(p.growthByDept || "{}"),
    }));

    return NextResponse.json({
      plans: parsedPlans,
      currentHeadcount: employees.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workforce plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const plan = await prisma.workforcePlan.create({
      data: {
        organizationId: session.organizationId,
        presetName: body.presetName || "Custom",
        growthByDept: JSON.stringify(body.growthByDept || {}),
        attritionRate: Number(body.attritionRate) || 15.0,
        agencyFeePct: Number(body.agencyFeePct) || 8.33,
        monthlyCapacity: Number(body.monthlyCapacity) || 5,
        totalHires: Number(body.totalHires) || 0,
        totalCost: Number(body.totalCost) || 0.0,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save workforce plan" }, { status: 500 });
  }
}
