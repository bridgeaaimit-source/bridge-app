import { NextResponse } from "next/server";
import { getSession } from "@/lib/team-pulse/auth";
import { prisma } from "@/lib/team-pulse/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: { organizationId: session.organizationId },
      include: { candidates: true },
      orderBy: { daysOpen: "desc" },
    });

    const parsed = jobs.map((j) => ({
      ...j,
      reqSkills: JSON.parse(j.reqSkills || "[]"),
      niceSkills: JSON.parse(j.niceSkills || "[]"),
      idealMbti: JSON.parse(j.idealMbti || "[]"),
      competencies: JSON.parse(j.competencies || "[]"),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const job = await prisma.job.create({
      data: {
        organizationId: session.organizationId,
        title: body.title,
        dept: body.dept,
        level: Number(body.level) || 2,
        expMin: Number(body.expMin) || 3.0,
        expMax: Number(body.expMax) || 6.0,
        reqSkills: JSON.stringify(body.reqSkills || []),
        niceSkills: JSON.stringify(body.niceSkills || []),
        idealMbti: JSON.stringify(body.idealMbti || []),
        bandMin: Number(body.bandMin) || 14.0,
        bandMax: Number(body.bandMax) || 24.0,
        daysOpen: 1,
        hiringManager: body.hiringManager || "HR Lead",
        competencies: JSON.stringify(body.competencies || []),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
