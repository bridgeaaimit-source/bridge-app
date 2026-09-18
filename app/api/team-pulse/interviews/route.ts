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
  const candidateId = searchParams.get("candidateId");

  try {
    const interviews = await prisma.interview.findMany({
      where: {
        organizationId: session.organizationId,
        ...(candidateId ? { candidateId } : {}),
      },
      include: { candidate: true, job: true },
      orderBy: { createdAt: "desc" },
    });

    const parsed = interviews.map((i) => ({
      ...i,
      ratings: JSON.parse(i.ratings || "{}"),
      notes: JSON.parse(i.notes || "{}"),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { candidateId, jobId, ratings, notes, verdict, summary } = body;

    const interview = await prisma.interview.create({
      data: {
        organizationId: session.organizationId,
        candidateId,
        jobId,
        interviewerId: session.userId,
        ratings: JSON.stringify(ratings || {}),
        notes: JSON.stringify(notes || {}),
        verdict: verdict || "Recommend Hire",
        summary: summary || "",
      },
    });

    if (verdict) {
      const stageMap: Record<string, string> = {
        "Strong Hire": "Offer",
        "Recommend Hire": "Offer",
        Hold: "Interview",
        Rejection: "Rejected",
      };

      await prisma.candidate.updateMany({
        where: { id: candidateId, organizationId: session.organizationId },
        data: { stage: stageMap[verdict] || "Interview" },
      });
    }

    return NextResponse.json(interview);
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit interview scorecard" }, { status: 500 });
  }
}
