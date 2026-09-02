import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScheduleIfNeeded } from "@/lib/scheduler";
import { submitSchema } from "@/lib/validations";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { scoreQuestion } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: { id:string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error:"invalid id"}, { status:400 });
  // 限流檢查：60秒 20 次，超限回 429
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }
  const body = await req.json();
  // zod 驗證：失敗回 400
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status:400 });
  const { userSelected, timeSpent } = parsed.data;
  const question = await prisma.question.findUnique({ where:{ id } });
  if (!question) return NextResponse.json({ error:"question not found"}, { status:404 });

  const { isCorrect, score } = scoreQuestion(question.questionType, question.answer, String(userSelected));

  await prisma.answerLog.create({
    data: {
      questionId: id,
      chapterId: question.chapterId,
      subjectId: question.subjectId,
      userSelected: String(userSelected),
      isCorrect,
      timeSpent: Number(timeSpent) || 0,
    }
  });

  // trigger scheduler if needed
  // compute chapter accuracy for this chapter
  const logs = await prisma.answerLog.findMany({ where:{ chapterId: question.chapterId } });
  const acc = logs.length ? (logs.filter(l=> l.isCorrect).length / logs.length *100) : 0;
  await triggerScheduleIfNeeded(question.chapterId, isCorrect, acc);

  return NextResponse.json({ isCorrect, score, correctAnswer: question.answer, accuracy: Math.round(acc) });
}
