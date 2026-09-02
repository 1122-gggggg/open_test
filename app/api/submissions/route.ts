import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questionId, contributorName, proposedExplanation, reason } = body;
  if (!questionId || !contributorName || !proposedExplanation || !reason) {
    return NextResponse.json({ error:"缺少必要欄位" }, { status:400 });
  }
  const q = await prisma.question.findUnique({ where:{ id: Number(questionId) }});
  if (!q) return NextResponse.json({ error:"題目不存在"}, { status:404 });

  const sub = await prisma.explanationSubmission.create({
    data: {
      questionId: Number(questionId),
      contributorName: String(contributorName).trim(),
      proposedExplanation: String(proposedExplanation),
      reason: String(reason),
      status: "PENDING",
    }
  });
  return NextResponse.json({ ok:true, id: sub.id });
}

export async function GET() {
  const list = await prisma.explanationSubmission.findMany({ orderBy:{ createdAt:"desc"}, include:{ question:{ include:{ subject:true, chapter:true } } } });
  return NextResponse.json(list);
}
