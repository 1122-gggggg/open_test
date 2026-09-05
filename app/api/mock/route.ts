import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { mockPaperSchema } from "@/lib/validations";
import { shuffle } from "@/lib/mock";

export const dynamic = "force-dynamic";

// 模擬考組卷：GET /api/mock?subject=&chapterId=&examType=&year=&count=
// 回傳已洗牌題目（剝除 answer/explanation，交卷後才給詳解）
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subjectCode = url.searchParams.get("subject");
  const chapterId = url.searchParams.get("chapterId");
  const examType = url.searchParams.get("examType");
  const year = url.searchParams.get("year");

  const rawCount = Number(url.searchParams.get("count") ?? "20");
  const parsedCount = mockPaperSchema.safeParse({ count: Number.isFinite(rawCount) ? Math.floor(rawCount) : 20 });
  if (!parsedCount.success) {
    return NextResponse.json({ error: parsedCount.error.issues }, { status: 400 });
  }
  const count = parsedCount.data.count;

  const where: Prisma.QuestionWhereInput = {};
  const chapterIdNum = chapterId !== null ? Number(chapterId) : NaN;
  if (chapterId !== null && Number.isFinite(chapterIdNum)) where.chapterId = chapterIdNum;
  if (examType) where.examType = examType;
  const yearNum = year !== null ? Number(year) : NaN;
  if (year !== null && Number.isFinite(yearNum)) where.year = yearNum;
  if (subjectCode) {
    const sub = await prisma.subject.findUnique({ where: { code: subjectCode } });
    if (!sub) return NextResponse.json({ questions: [], totalAvailable: 0 });
    where.subjectId = sub.id;
  }

  // 先只取 id（池上限 2000，避免全表掃回記憶體），洗牌後再取完整題目
  const idRows = await prisma.question.findMany({ where, select: { id: true }, take: 2000 });
  const totalAvailable = await prisma.question.count({ where });
  if (idRows.length === 0) return NextResponse.json({ questions: [], totalAvailable });

  const picked = shuffle(idRows.map((r) => r.id)).slice(0, count);
  const rows = await prisma.question.findMany({
    where: { id: { in: picked } },
    include: { subject: true, chapter: true },
  });
  const order = new Map(picked.map((id, idx) => [id, idx]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  // 剝除答案與詳解：考試中不可見
  const questions = rows.map((q) => ({
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    examType: q.examType,
    year: q.year,
    questionNumber: q.questionNumber,
    questionType: q.questionType,
    stem: q.stem,
    options: q.options,
    difficulty: q.difficulty,
  }));
  return NextResponse.json({ questions, totalAvailable });
}
