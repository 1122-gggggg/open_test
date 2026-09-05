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
  const chapterIdNum = chapterId !== null ? Number(chapterId) : NaN;
  if (chapterId !== null && Number.isFinite(chapterIdNum)) where.chapterId = chapterIdNum;
  if (examType) where.examType = examType;
  const yearNum = year !== null ? Number(year) : NaN;
  if (year !== null && Number.isFinite(yearNum)) where.year = yearNum;
  // subjectCode 需要關聯查詢；code 不存在時直接回空頁（避免誤回全科）
  if (subjectCode) {
    const sub = await prisma.subject.findUnique({ where: { code: subjectCode } });
    if (!sub) {
      return NextResponse.json({ questions: [], nextCursor: null, total: 0, hasMore: false });
    }
    where.subjectId = sub.id;
  }
  // 關鍵字模糊搜尋條件（兩條路徑共用，避免 OR/AND 重複疊加）
  const searchFilter = search
    ? { OR: [{ stem: { contains: search } }, { explanationSource: { contains: search } }] }
    : null;

  // 向後兼容：無 take 時回舊格式陣列（ExamClient 直接將 prop 當陣列使用）
  if (rawTake === null) {
    const questions = await prisma.question.findMany({
      where: searchFilter ? { ...where, ...searchFilter } : where,
      include: { subject: true, chapter: true },
      orderBy: [{ year: "desc" }, { questionNumber: "asc" }],
    });
    return NextResponse.json(questions);
  }

  // 分頁邏輯：take 1-50 預設 20；排序固定 year DESC + id ASC，cursor 為 keyset
  let take = Number(rawTake);
  if (!Number.isFinite(take) || take <= 0) take = 20;
  take = Math.min(50, Math.max(1, Math.floor(take)));

  // total 不含 cursor（含搜尋條件，顯示符合條件的總數）
  const baseWhere: Prisma.QuestionWhereInput = searchFilter ? { ...where, ...searchFilter } : { ...where };
  const totalPromise = prisma.question.count({ where: baseWhere });

  // keyset cursor：需與 orderBy (year DESC, id ASC) 一致。
  // cursor 編碼為 `${year}:${id}`（新版）；純數字視為舊版 id cursor 做最佳 effort 相容。
  if (cursorRaw !== null && cursorRaw !== "") {
    const keysetOr = (cYear: number, cId: number) => ({
      OR: [{ year: { lt: cYear } }, { year: cYear, id: { gt: cId } }],
    });
    const parts = cursorRaw.split(":");
    if (parts.length === 2) {
      const cYear = Number(parts[0]);
      const cId = Number(parts[1]);
      if (Number.isFinite(cYear) && Number.isFinite(cId)) {
        where.AND = [...(searchFilter ? [searchFilter] : []), keysetOr(cYear, cId)];
      } else if (searchFilter) {
        where.OR = searchFilter.OR;
      }
    } else {
      const cursorId = Number(cursorRaw);
      if (Number.isFinite(cursorId)) {
        const anchor = await prisma.question.findUnique({ where: { id: cursorId }, select: { year: true } });
        if (anchor) {
          where.AND = [...(searchFilter ? [searchFilter] : []), keysetOr(anchor.year, cursorId)];
        } else {
          where.id = { gt: cursorId };
          if (searchFilter) where.OR = searchFilter.OR;
        }
      } else if (searchFilter) {
        where.OR = searchFilter.OR;
      }
    }
  } else if (searchFilter) {
    where.OR = searchFilter.OR;
  }

  // 多取 1 筆判斷 hasMore，避免前端多打一次空頁
  const rows = await prisma.question.findMany({
    where,
    include: { subject: true, chapter: true },
    orderBy: [{ year: "desc" }, { id: "asc" }],
    take: take + 1,
  });
  const total = await totalPromise;

  const hasMore = rows.length > take;
  const questions = hasMore ? rows.slice(0, take) : rows;
  const last = questions.length > 0 ? questions[questions.length - 1] : null;
  const nextCursor = last && hasMore ? `${last.year}:${last.id}` : null;
  return NextResponse.json({ questions, nextCursor, total, hasMore });
}
