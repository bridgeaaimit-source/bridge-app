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
  const stage = searchParams.get("stage");
  const jobId = searchParams.get("jobId");

  const whereClause: any = { organizationId: session.organizationId };
  if (stage && stage !== "All") whereClause.stage = stage;
  if (jobId && jobId !== "All") whereClause.jobId = jobId;

  try {
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: { job: true },
      orderBy: { createdAt: "desc" },
    });

    const parsed = candidates.map((c) => ({
      ...c,
      skills: JSON.parse(c.skills || "[]"),
      fitDetails: JSON.parse(c.fitDetails || "{}"),
      redFlags: JSON.parse(c.redFlags || "[]"),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const candidate = await prisma.candidate.create({
      data: {
        organizationId: session.organizationId,
        jobId: body.jobId || null,
        name: body.name,
        company: body.company || "TechCorp",
        title: body.title || "Engineer",
        stage: body.stage || "Sourced",
        exp: Number(body.exp) || 4.0,
        curCtc: Number(body.curCtc) || 12.0,
        expcCtc: Number(body.expcCtc) || 16.0,
        city: body.city || "Bengaluru",
        notice: Number(body.notice) || 30,
        offers: Number(body.offers) || 0,
        gender: body.gender || "F",
        mbti: body.mbti || "INTP",
        source: body.source || "LinkedIn",
        skills: JSON.stringify(body.skills || []),
        fitScore: Number(body.fitScore) || 75.0,
        fitDetails: JSON.stringify(body.fitDetails || { overall: 75, skills: 80, exp: 75, pers: 70, retention: 75 }),
        redFlags: JSON.stringify(body.redFlags || []),
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, stage, fitScore, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Candidate ID required" }, { status: 400 });
    }

    const updated = await prisma.candidate.updateMany({
      where: { id, organizationId: session.organizationId },
      data: {
        ...(stage ? { stage } : {}),
        ...(fitScore ? { fitScore: Number(fitScore) } : {}),
        ...rest,
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}
