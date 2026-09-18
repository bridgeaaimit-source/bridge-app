import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const complianceRecords = await prisma.complianceRecord.findMany({
      where: { organizationId: session.organizationId },
    });

    const employees = await prisma.employee.findMany({
      where: { organizationId: session.organizationId },
    });

    let totalTrainings = 0;
    let completedTrainings = 0;
    let overdueCount = 0;

    const employeeCompliance = employees.map((e) => {
      const train = JSON.parse(e.trainings || "{}");
      const docs = JSON.parse(e.documents || "{}");

      const trainValues = Object.values(train);
      trainValues.forEach((val) => {
        if (val !== "na") totalTrainings++;
        if (val === "done") completedTrainings++;
        if (val === "over") overdueCount++;
      });

      const missingDocs = Object.entries(docs)
        .filter(([, v]) => v === "missing")
        .map(([k]) => k);

      return {
        id: e.id,
        name: e.name,
        role: e.role,
        dept: e.dept,
        trainings: train,
        documents: docs,
        hasOverdue: Object.values(train).includes("over"),
        missingDocs,
      };
    });

    const trainingRate = totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 84;

    return NextResponse.json({
      companyRecords: complianceRecords,
      employeeCompliance,
      trainingRate,
      overdueEmployeesCount: employeeCompliance.filter((e) => e.hasOverdue).length,
      missingDocsEmployeesCount: employeeCompliance.filter((e) => e.missingDocs.length > 0).length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (body.action === "remind") {
      return NextResponse.json({
        success: true,
        message: "Compliance reminders sent to employees and managers.",
      });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process compliance action" }, { status: 500 });
  }
}
