import { describe, it, expect } from "vitest";
import { shuffle, gradeMockPaper, formatCountdown } from "@/lib/mock";

describe("shuffle", () => {
  it("保留全部元素且不動原陣列", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src, () => 0.5);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  it("固定 rand 可重現洗牌結果", () => {
    const a = shuffle([1, 2, 3, 4], () => 0);
    const b = shuffle([1, 2, 3, 4], () => 0);
    expect(a).toEqual(b);
  });

  it("空陣列回空陣列", () => {
    expect(shuffle([])).toEqual([]);
  });
});

describe("gradeMockPaper 整卷評分", () => {
  it("單選全對滿分", () => {
    const s = gradeMockPaper([
      { questionId: 1, questionType: "SINGLE", correctAnswer: "A", userSelected: "A" },
      { questionId: 2, questionType: "SINGLE", correctAnswer: "B", userSelected: "B" },
    ]);
    expect(s.correctCount).toBe(2);
    expect(s.totalScore).toBe(200);
    expect(s.maxScore).toBe(200);
    expect(s.accuracy).toBe(100);
  });

  it("多選少選給部分分但不算答對", () => {
    const s = gradeMockPaper([
      { questionId: 1, questionType: "MULTIPLE", correctAnswer: "A,B,C", userSelected: "A,B" },
    ]);
    expect(s.correctCount).toBe(0);
    expect(s.results[0].score).toBeGreaterThan(0);
    expect(s.results[0].score).toBeLessThan(100);
  });

  it("未作答以 0 分計且不中斷整卷", () => {
    const s = gradeMockPaper([
      { questionId: 1, questionType: "SINGLE", correctAnswer: "A", userSelected: "" },
      { questionId: 2, questionType: "SINGLE", correctAnswer: "B", userSelected: "B" },
    ]);
    expect(s.results[0].score).toBe(0);
    expect(s.correctCount).toBe(1);
    expect(s.accuracy).toBe(50);
  });

  it("空卷回零分零正確率", () => {
    const s = gradeMockPaper([]);
    expect(s.totalScore).toBe(0);
    expect(s.accuracy).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("不足一小時顯示 mm:ss", () => {
    expect(formatCountdown(90)).toBe("01:30");
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("超過一小時顯示 hh:mm:ss", () => {
    expect(formatCountdown(3661)).toBe("01:01:01");
  });

  it("負數箝制為 00:00", () => {
    expect(formatCountdown(-5)).toBe("00:00");
  });
});
