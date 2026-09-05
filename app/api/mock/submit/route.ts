import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mockSubmitSchema } from "@/lib/validations";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { gradeMockPaper } from "@/lib/mock";
import { triggerScheduleIfNeeded } from "@/lib/scheduler";
import { getUserKeyFromHeaders } from "@/lib/user";

export const dynamic = "force-dynamic";

// 模擬考交卷：POST /api/mock/submit { answers: { [qid]: userSelected }, timeSpent? }
// 逐題沿用 scoreQuestion 計分，寫入 AnswerLog（帶入 userKey），弱章節觸發排程
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }
  const userKey = getUserKeyFromHeaders(req.headers);
  const body = await req.json();
  const parsed = mockSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const entries = Object.entries(parsed.data.answers);
  const ids = entries
    .map(([qid]) => Number(qid))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) {
    return NextResponse.json({ error: "answers 不可為空" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({ where: { id: { in: ids } } });
  if (questions.length === 0) {
    return NextResponse.json({ error: "題目不存在" }, { status: 404 });
  }
  const byId = new Map(questions.map((q) => [q.id, q]));

  const summary = gradeMockPaper(
    entries.map(([qid, userSelected]) => {
      const q = byId.get(Number(qid));
      return {
        questionId: Number(qid),
        questionType: q?.questionType ?? "SINGLE",
        correctAnswer: q?.answer ?? "",
        userSelected: String(userSelected),
      };
    })
  );

  // 作答紀錄：整卷一次寫入（帶入 userKey）
  const perQuestionTime =
    parsed.data.timeSpent !== undefined && summary.results.length > 0
      ? Math.max(0, Math.round(parsed.data.timeSpent / summary.results.length))
      : 0;
  await prisma.answerLog.createMany({
    data: summary.results
      .filter((r) => byId.has(r.questionId))
      .map((r) => {
        const q = byId.get(r.questionId);
        return {
          questionId: r.questionId,
          chapterId: q?.chapterId ?? 0,
          subjectId: q?.subjectId ?? 0,
          userSelected: r.userSelected,
          isCorrect: r.isCorrect,
          timeSpent: perQuestionTime,
          userKey,
        };
      })
      .filter((d) => d.chapterId > 0 && d.subjectId > 0),
  });

  // 弱章節排程：依本次交卷各章節正確率觸發（<70% 或有錯即排，帶入 userKey）
  const chapterIds = [...new Set(questions.map((q) => q.chapterId))];
  await Promise.all(
    chapterIds.map(async (chapterId) => {
      const [total, correct] = await Promise.all([
        prisma.answerLog.count({ where: { chapterId, userKey } }),
        prisma.answerLog.count({ where: { chapterId, isCorrect: true, userKey } }),
      ]);
      const acc = total > 0 ? (correct / total) * 100 : 0;
      const chapterWrong = summary.results.some((r) => {
        const q = byId.get(r.questionId);
        return q?.chapterId === chapterId && !r.isCorrect;
      });
      await triggerScheduleIfNeeded(chapterId, !chapterWrong, acc, userKey);
    })
  );

  // 回傳整卷報表＋逐題回顧（含詳解）
  const review = summary.results.map((r) => {
    const q = byId.get(r.questionId);
    return {
      questionId: r.questionId,
      userSelected: r.userSelected,
      correctAnswer: r.correctAnswer,
      isCorrect: r.isCorrect,
      score: r.score,
      stem: q?.stem ?? "",
      options: q?.options ?? "[]",
      explanation: q?.explanation ?? "",
      explanationSource: q?.explanationSource ?? "",
      questionType: q?.questionType ?? "SINGLE",
      year: q?.year,
      examType: q?.examType,
    };
  });

  return NextResponse.json({
    totalScore: summary.totalScore,
    maxScore: summary.maxScore,
    correctCount: summary.correctCount,
    total: summary.results.length,
    accuracy: summary.accuracy,
    items: review,
  });
}
