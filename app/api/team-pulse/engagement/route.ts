import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export const dynamic = "force-dynamic";

const DEFAULT_PULSE_COMMENTS = [
  "Engineering: The weekend on-call schedule is exhausting. We need a proper rotation.",
  "Sales: Great incentives this quarter, but targets keep moving every month.",
  "Data: SQL and Python stack is solid, but we need dbt training for the new joiners.",
  "Product: Love the hybrid flexibility, 3 days in office works well for design reviews.",
  "Customer Success: Account load per CSM is too high. Hard to maintain response times.",
  "HR: Onboarding process has improved significantly since last quarter.",
  "Finance: Manual reconciliation in Excel takes 3 days every month end.",
  "Engineering: Too many meetings in the morning. Need uninterrupted coding blocks.",
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const records = await prisma.engagementRecord.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
    });

    const employees = await prisma.employee.findMany({
      where: { organizationId: session.organizationId },
    });

    const moodByDept: Record<string, number> = {
      Engineering: 57,
      Data: 64,
      Product: 74,
      Sales: 68,
      "Customer Success": 62,
      HR: 76,
      Finance: 71,
    };

    const eNPSHistory = [
      { m: "Apr", v: 15 },
      { m: "May", v: 14 },
      { m: "Jun", v: 16 },
      { m: "Jul", v: 15 },
      { m: "Aug", v: 17 },
      { m: "Sep", v: 18 },
    ];

    return NextResponse.json({
      moodByDept,
      eNPSHistory,
      eNPS: 18,
      comments: DEFAULT_PULSE_COMMENTS,
      burnoutWarnings: [
        { dept: "Engineering", otAvg: 51, drop: 13, reason: "On-call & weekend work" },
        { dept: "Customer Success", otAvg: 48, drop: 8, reason: "High account load" },
      ],
      exits: [
        { role: "Senior SDE", dept: "Engineering", tenure: 2.1, reason: "Higher offer / market pay", quote: "Got a 45% hike elsewhere." },
        { role: "Product Designer", dept: "Product", tenure: 1.8, reason: "Career growth", quote: "Wanted more ownership of strategy." },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch engagement data" }, { status: 500 });
  }
}
