// 模擬考純函式：洗牌、整卷評分、倒數格式化
// 刻意與 DB 解耦，供 API route 與 vitest 直接引用
import { scoreQuestion } from "./scoring";

export interface MockAnswerInput {
  questionId: number;
  questionType: string;
  correctAnswer: string;
  userSelected: string;
}

export interface MockItemResult {
  questionId: number;
  userSelected: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
}

export interface MockPaperSummary {
  results: MockItemResult[];
  totalScore: number;
  maxScore: number;
  correctCount: number;
  accuracy: number;
}

// Fisher–Yates 洗牌（不動原陣列；rand 可注入以利測試）
export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// 整卷評分：逐題沿用 scoreQuestion 規則後加總
export function gradeMockPaper(items: MockAnswerInput[]): MockPaperSummary {
  const results: MockItemResult[] = items.map((it) => {
    const userSelected = it.userSelected.trim();
    if (!userSelected) {
      return { questionId: it.questionId, userSelected: "", correctAnswer: it.correctAnswer, isCorrect: false, score: 0 };
    }
    const { isCorrect, score } = scoreQuestion(it.questionType, it.correctAnswer, userSelected);
    return { questionId: it.questionId, userSelected, correctAnswer: it.correctAnswer, isCorrect, score };
  });
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.length * 100;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  return { results, totalScore, maxScore, correctCount, accuracy };
}

// 倒數顯示：<1h 顯示 mm:ss，否則 hh:mm:ss；負數箝制為 0
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}
