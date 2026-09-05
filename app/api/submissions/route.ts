import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { submissionSchema } from "@/lib/validations";
export async function POST(req: NextRequest) {
  const body = await req.json();
  // zod 驗證：失敗回 400
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status:400 });
  const { questionId, contributorName, proposedExplanation, reason } = parsed.data;
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

export async function GET(req: NextRequest) {
  // 審核清單僅管理員可讀：有設 ADMIN_TOKEN 時需帶 x-admin-token（與 admin API 一致）
  const expected = process.env.ADMIN_TOKEN;
  if (expected && req.headers.get("x-admin-token") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const list = await prisma.explanationSubmission.findMany({ orderBy:{ createdAt:"desc"}, include:{ question:{ include:{ subject:true, chapter:true } } } });
  return NextResponse.json(list);
}
