// 計分邏輯：支援單選、多選、選填、混合題
// 多選扣分規則：全對 100，少選（無錯選）按 60% 比例，錯選按 40% 比例
export function scoreQuestion(
  questionType: string,
  correct: string,
  userSelected: string
): { isCorrect: boolean; score: number } {
  const correctSet = correct.split(",").map((s) => s.trim()).filter(Boolean);
  const userSet = userSelected.split(",").map((s) => s.trim()).filter(Boolean);
  const correctSorted = [...correctSet].sort().join(",");
  const userSorted = [...userSet].sort().join(",");

  if (questionType === "SINGLE" || questionType === "FILL_IN") {
    const ok = correctSorted === userSorted;
    return { isCorrect: ok, score: ok ? 100 : 0 };
  }

  if (questionType === "MULTIPLE" || questionType === "MIXED") {
    const correctLookup = new Set(correctSet);
    const hasWrong = userSet.some((x) => !correctLookup.has(x));
    const correctCount = userSet.filter((x) => correctLookup.has(x)).length;
    const totalCorrect = correctSet.length;
    if (totalCorrect === 0) return { isCorrect: false, score: 0 };
    if (!hasWrong && correctCount === totalCorrect) return { isCorrect: true, score: 100 };
    if (hasWrong) {
      // 有錯選：最高 40 分，按答對比例計算
      const partial = Math.round((correctCount / totalCorrect) * 40);
      return { isCorrect: false, score: partial };
    } else {
      // 少選但無錯選：按 60% 比例
      const partial = Math.round((correctCount / totalCorrect) * 60);
      return { isCorrect: false, score: partial };
    }
  }

  return {
    isCorrect: correctSorted === userSorted,
    score: correctSorted === userSorted ? 100 : 0,
  };
}

// 兼容舊式：計算多選部分分數的純函式（供測試使用）
export function calcMultipleScore(correct: string, userSelected: string) {
  return scoreQuestion("MULTIPLE", correct, userSelected);
}
