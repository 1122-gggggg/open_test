// 弱點判定與掌握度等級
// 依 accuracy 判定：<60 高度弱點，60~80 普通，>80 精熟

export type MasteryLevel = "高度弱點需優先補強" | "高度弱點" | "普通" | "精熟" | "未作答";

export function getMasteryLevel(accuracy: number, total: number, variant: "subject" | "chapter" = "subject"): MasteryLevel {
  if (total === 0) return "未作答";
  if (accuracy < 60) return variant === "subject" ? "高度弱點需優先補強" : "高度弱點";
  if (accuracy < 80) return "普通";
  return "精熟";
}

// 計算答對率（四捨五入百分比）
export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// 判定是否為弱點（accuracy < 60）
export function isWeakness(accuracy: number): boolean {
  return accuracy < 60;
}

// 章節統計型別（與 /api/analytics/weakness 一致）
export function buildSubjectStats(
  subjects: { id: number; name: string; icon: string; category: string }[],
  logs: { subjectId: number; isCorrect: boolean; timeSpent: number }[]
) {
  return subjects.map((s) => {
    const sLogs = logs.filter((l) => l.subjectId === s.id);
    const total = sLogs.length;
    const correct = sLogs.filter((l) => l.isCorrect).length;
    const accuracy = calcAccuracy(correct, total);
    const avgTime = total ? Math.round(sLogs.reduce((a, b) => a + b.timeSpent, 0) / total) : 0;
    const level = getMasteryLevel(accuracy, total, "subject");
    return { subjectId: s.id, subjectName: s.name, icon: s.icon, category: s.category, total, correct, accuracy, avgTime, level };
  });
}

export function buildChapterStats(
  chapters: { id: number; name: string; subjectName: string; subjectId?: number }[],
  logs: { chapterId: number; isCorrect: boolean }[]
) {
  return chapters
    .map((c) => {
      const cLogs = logs.filter((l) => l.chapterId === c.id);
      const total = cLogs.length;
      const correct = cLogs.filter((l) => l.isCorrect).length;
      const accuracy = calcAccuracy(correct, total);
      const errorRate = total ? Math.round((1 - correct / total) * 100) : 0;
      const level = getMasteryLevel(accuracy, total, "chapter");
      return { chapterId: c.id, chapterName: c.name, subjectName: c.subjectName, total, correct, accuracy, errorRate, level };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy);
}
