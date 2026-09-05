import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScheduleIfNeeded } from "@/lib/scheduler";
import { submitSchema } from "@/lib/validations";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { scoreQuestion } from "@/lib/scoring";
import { getUserKeyFromHeaders } from "@/lib/user";

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
  // 空答案直接退回，避免寫入無意義作答紀錄
  if (String(userSelected).trim().length === 0) {
    return NextResponse.json({ error: "userSelected 不可為空" }, { status: 400 });
  }
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });
  const userKey = getUserKeyFromHeaders(req.headers);
  const { isCorrect, score } = scoreQuestion(question.questionType, question.answer, String(userSelected));

  await prisma.answerLog.create({
    data: {
      questionId: id,
      chapterId: question.chapterId,
      subjectId: question.subjectId,
      userSelected: String(userSelected),
      isCorrect,
      timeSpent: Number(timeSpent) || 0,
      userKey,
    }
  });

  // 章節正確率改用 count 聚合（依 userKey 隔離，若無紀錄則全量保底）
  const [chapterTotal, chapterCorrect] = await Promise.all([
    prisma.answerLog.count({ where: { chapterId: question.chapterId, userKey } }),
    prisma.answerLog.count({ where: { chapterId: question.chapterId, isCorrect: true, userKey } }),
  ]);
  const acc = chapterTotal > 0 ? (chapterCorrect / chapterTotal) * 100 : 0;
  await triggerScheduleIfNeeded(question.chapterId, isCorrect, acc, userKey);
  return NextResponse.json({ isCorrect, score, correctAnswer: question.answer, accuracy: Math.round(acc) });
}
