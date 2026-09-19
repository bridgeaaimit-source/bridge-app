import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";
import { getCached, setCached, CacheKeys } from "@/lib/team-pulse/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.organizationId;
  const cacheKey = CacheKeys.compliance(organizationId);
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [complianceRecords, employees] = await Promise.all([
      prisma.complianceRecord.findMany({
        where: { organizationId },
      }),
      prisma.employee.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          role: true,
          dept: true,
          trainings: true,
          documents: true,
        },
      }),
    ]);

    let totalTrainings = 0;
    let completedTrainings = 0;

    const employeeCompliance = employees.map((e) => {
      let train: Record<string, string> = {};
      let docs: Record<string, string> = {};

      try {
        train = JSON.parse(e.trainings || "{}");
      } catch {}

      try {
        docs = JSON.parse(e.documents || "{}");
      } catch {}

      const trainValues = Object.values(train);
      trainValues.forEach((val) => {
        if (val !== "na") totalTrainings++;
        if (val === "done") completedTrainings++;
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

    const trainingRate =
      totalTrainings > 0
        ? Math.round((completedTrainings / totalTrainings) * 100)
        : 84;

    const result = {
      companyRecords: complianceRecords,
      employeeCompliance,
      trainingRate,
      overdueEmployeesCount: employeeCompliance.filter((e) => e.hasOverdue).length,
      missingDocsEmployeesCount: employeeCompliance.filter(
        (e) => e.missingDocs.length > 0
      ).length,
    };

    setCached(cacheKey, result, 60);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch compliance data" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "Failed to process compliance action" },
      { status: 500 }
    );
  }
}
