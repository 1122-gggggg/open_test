import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  // 平行查詢：科目/章節主檔 + DB 聚合統計 + 錯題去重
  const [
    subjects,
    chapters,
    subjectTotalGroups,
    subjectCorrectGroups,
    chapterTotalGroups,
    chapterCorrectGroups,
    totalLogs,
    errorQuestionIdRows,
  ] = await Promise.all([
    prisma.subject.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.chapter.findMany({ include: { subject: true } }),
    // 各科目總作答數與平均耗時（DB 端聚合）
    prisma.answerLog.groupBy({
      by: ["subjectId"],
      _count: { id: true },
      _avg: { timeSpent: true },
    }),
    // 各科目答對數（where isCorrect true 再 groupBy）
    prisma.answerLog.groupBy({
      by: ["subjectId"],
      where: { isCorrect: true },
      _count: { id: true },
    }),
    // 各章節總作答數
    prisma.answerLog.groupBy({
      by: ["chapterId"],
      _count: { id: true },
    }),
    // 各章節答對數
    prisma.answerLog.groupBy({
      by: ["chapterId"],
      where: { isCorrect: true },
      _count: { id: true },
    }),
    prisma.answerLog.count(),
    // 錯題本：DB 端 distinct 取 questionId，避免拉全表 JS filter
    prisma.answerLog.findMany({
      where: { isCorrect: false },
      distinct: ["questionId"],
      select: { questionId: true },
    }),
  ]);

  // 轉為 Map 以 O(1) 合併
  const subjectTotalMap = new Map<number, { total: number; avgTime: number }>();
  for (const g of subjectTotalGroups) {
    subjectTotalMap.set(g.subjectId, {
      total: g._count.id,
      avgTime: g._avg.timeSpent != null ? Math.round(g._avg.timeSpent) : 0,
    });
  }
  const subjectCorrectMap = new Map<number, number>();
  for (const g of subjectCorrectGroups) {
    subjectCorrectMap.set(g.subjectId, g._count.id);
  }

  const chapterTotalMap = new Map<number, number>();
  for (const g of chapterTotalGroups) {
    chapterTotalMap.set(g.chapterId, g._count.id);
  }
  const chapterCorrectMap = new Map<number, number>();
  for (const g of chapterCorrectGroups) {
    chapterCorrectMap.set(g.chapterId, g._count.id);
  }

  // 科目掌握度統計（保持原回傳格式與 level 判定）
  const subjectStats = subjects.map((s) => {
    const total = subjectTotalMap.get(s.id)?.total ?? 0;
    const correct = subjectCorrectMap.get(s.id) ?? 0;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const avgTime = subjectTotalMap.get(s.id)?.avgTime ?? 0;
    let level = "精熟";
    if (total === 0) level = "未作答";
    else if (accuracy < 60) level = "高度弱點需優先補強";
    else if (accuracy < 80) level = "普通";
    else level = "精熟";
    return {
      subjectId: s.id,
      subjectName: s.name,
      icon: s.icon,
      category: s.category,
      total,
      correct,
      accuracy,
      avgTime,
      level,
    };
  });

  // 章節掌握度統計（過濾未作答並依 accuracy 升冪）
  const chapterStats = chapters
    .map((c) => {
      const total = chapterTotalMap.get(c.id) ?? 0;
      const correct = chapterCorrectMap.get(c.id) ?? 0;
      const accuracy = total ? Math.round((correct / total) * 100) : 0;
      const errorRate = total ? Math.round((1 - correct / total) * 100) : 0;
      let level = "精熟";
      if (total === 0) level = "未作答";
      else if (accuracy < 60) level = "高度弱點";
      else if (accuracy < 80) level = "普通";
      else level = "精熟";
      return {
        chapterId: c.id,
        chapterName: c.name,
        subjectName: c.subject.name,
        total,
        correct,
        accuracy,
        errorRate,
        level,
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy);

  const topWeakness = chapterStats.slice(0, 5);

  // 錯題本：依去重後的 questionId 查題目詳情
  const errorQuestionIds = errorQuestionIdRows.map((r) => r.questionId);
  const errorQuestions = errorQuestionIds.length
    ? await prisma.question.findMany({
        where: { id: { in: errorQuestionIds } },
        include: { subject: true, chapter: true },
      })
    : [];

  return NextResponse.json({ subjectStats, chapterStats, topWeakness, errorQuestions, totalLogs });
}
