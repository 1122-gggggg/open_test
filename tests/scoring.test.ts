import { describe, it, expect } from "vitest";
import { scoreQuestion } from "@/lib/scoring";

describe("scoreQuestion 多選扣分邏輯", () => {
  // 單選：全對 100，錯選 0
  it("單選全對回 100", () => {
    const r = scoreQuestion("SINGLE", "B", "B");
    expect(r.isCorrect).toBe(true);
    expect(r.score).toBe(100);
  });

  it("單選答錯回 0", () => {
    const r = scoreQuestion("SINGLE", "B", "A");
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(0);
  });

  // 多選：全對 100
  it("多選全對回 100（順序無關）", () => {
    const r = scoreQuestion("MULTIPLE", "A,B", "B,A");
    expect(r.isCorrect).toBe(true);
    expect(r.score).toBe(100);
  });

  it("多選全對（3 選）回 100", () => {
    const r = scoreQuestion("MULTIPLE", "A,B,C", "C,B,A");
    expect(r.score).toBe(100);
    expect(r.isCorrect).toBe(true);
  });

  // 少選（無錯選）：按 60% 比例計分，最高 60
  it("多選少選無錯選：答對 1/2 得 30（60% 比例）", () => {
    // 正解 A,B，僅選 A => 1/2 *60 =30
    const r = scoreQuestion("MULTIPLE", "A,B", "A");
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(30);
  });

  it("多選少選無錯選：答對 2/3 得 40（60% 比例）", () => {
    const r = scoreQuestion("MULTIPLE", "A,B,C", "A,B");
    expect(r.score).toBe(40); // 2/3*60=40
    expect(r.isCorrect).toBe(false);
  });

  it("多選少選比例上限為 60", () => {
    // 任何少選分數不超過 60
    const r1 = scoreQuestion("MULTIPLE", "A,B", "A");
    const r2 = scoreQuestion("MULTIPLE", "A,B,C,D", "A,B,C");
    expect(r1.score).toBeLessThanOrEqual(60);
    expect(r2.score).toBeLessThanOrEqual(60);
    // 2/2 全對是 100 已在上例測過，少選 3/4 => 45
    expect(r2.score).toBe(45);
  });

  // 錯選（含錯誤選項）：按 40% 比例，最高 40
  it("多選錯選：答對 1/2 且含錯選得 20（40% 比例）", () => {
    // 正解 A,B，選 A,C（C 為錯） => 1/2*40=20
    const r = scoreQuestion("MULTIPLE", "A,B", "A,C");
    expect(r.isCorrect).toBe(false);
    expect(r.score).toBe(20);
  });

  it("多選錯選上限 40：答對 2/3 且含錯選", () => {
    // 正解 A,B,C，選 A,B,D => 2/3*40≈27
    const r = scoreQuestion("MULTIPLE", "A,B,C", "A,B,D");
    expect(r.score).toBe(27);
    expect(r.score).toBeLessThanOrEqual(40);
  });

  it("多選全錯或只選錯選得 0", () => {
    const r = scoreQuestion("MULTIPLE", "A,B", "C,D");
    expect(r.score).toBe(0);
  });

  it("多選少選 60 與錯選 40 的差異：同樣答對 2/3，少選得 40，錯選得 27", () => {
    const less = scoreQuestion("MULTIPLE", "A,B,C", "A,B"); // 少選
    const wrong = scoreQuestion("MULTIPLE", "A,B,C", "A,B,D"); // 錯選
    expect(less.score).toBe(40);
    expect(wrong.score).toBe(27);
    expect(less.score).toBeGreaterThan(wrong.score);
  });

  // MIXED 類型同 MULTIPLE
  it("MIXED 類型全對 100", () => {
    const r = scoreQuestion("MIXED", "A,B", "A,B");
    expect(r.score).toBe(100);
  });

  it("MIXED 少選依 60% 計算", () => {
    const r = scoreQuestion("MIXED", "A,B", "A");
    expect(r.score).toBe(30);
  });

  it("MIXED 錯選依 40% 計算", () => {
    const r = scoreQuestion("MIXED", "A,B", "A,C");
    expect(r.score).toBe(20);
  });

  // 選填
  it("選填全對 100，答錯 0", () => {
    expect(scoreQuestion("FILL_IN", "42", "42").score).toBe(100);
    expect(scoreQuestion("FILL_IN", "42", "43").score).toBe(0);
  });

  // 空字串與空白容錯
  it("空字串視為未作答得 0", () => {
    const r = scoreQuestion("MULTIPLE", "A,B", "");
    expect(r.score).toBe(0);
  });
});
