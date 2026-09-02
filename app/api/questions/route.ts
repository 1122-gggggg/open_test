import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subjectCode = url.searchParams.get("subject");
  const chapterId = url.searchParams.get("chapterId");
  const examType = url.searchParams.get("examType");
  const year = url.searchParams.get("year");
  // 分頁與搜尋參數
  const rawTake = url.searchParams.get("take");
  const cursorRaw = url.searchParams.get("cursor");
  const searchRaw = url.searchParams.get("search");

  // 搜尋關鍵字消毒：去空白、限長 50、移除 < > 避免 XSS
  let search: string | null = null;
  if (searchRaw !== null) {
    const sanitized = searchRaw.trim().slice(0, 50).replace(/[<>]/g, "");
    if (sanitized.length > 0) search = sanitized;
  }

  const where: Prisma.QuestionWhereInput = {};
  if (chapterId) where.chapterId = Number(chapterId);
  if (examType) where.examType = examType;
  if (year) where.year = Number(year);
  // subjectCode 需要關聯查詢
  if (subjectCode) {
    const sub = await prisma.subject.findUnique({ where: { code: subjectCode } });
    if (sub) where.subjectId = sub.id;
  }
  // 關鍵字模糊搜尋：題幹或來源
  if (search) {
    where.OR = [
      { stem: { contains: search } },
      { explanationSource: { contains: search } },
    ];
  }

  // 向後兼容：無 take 時回舊格式陣列（ExamClient 直接將 prop 當陣列使用）
  if (rawTake === null) {
    const questions = await prisma.question.findMany({
      where,
      include: { subject: true, chapter: true },
      orderBy: [{ year: "desc" }, { questionNumber: "asc" }],
    });
    return NextResponse.json(questions);
  }

  // 分頁邏輯：take 1-50 預設 20
  let take = Number(rawTake);
  if (!Number.isFinite(take) || take <= 0) take = 20;
  take = Math.min(50, Math.max(1, Math.floor(take)));

  // total 不含 cursor（顯示符合搜尋條件的總數）
  const totalWhere: Prisma.QuestionWhereInput = { ...where };
  const totalPromise = prisma.question.count({ where: totalWhere });

  // cursor：簡單以 id > cursor 過濾，配合 orderBy id asc
  if (cursorRaw !== null) {
    const cursorId = Number(cursorRaw);
    if (Number.isFinite(cursorId)) {
      where.id = { gt: cursorId };
    }
  }

  const questions = await prisma.question.findMany({
    where,
    include: { subject: true, chapter: true },
    orderBy: [{ year: "desc" }, { id: "asc" }],
    take,
  });
  const total = await totalPromise;

  const nextCursor = questions.length > 0 ? questions[questions.length - 1].id : null;
  return NextResponse.json({ questions, nextCursor, total });
}
