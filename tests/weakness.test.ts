import { describe, it, expect } from "vitest";

function level(accuracy: number, total: number): string {
  if (total===0) return "未作答";
  if (accuracy < 60) return "高度弱點需優先補強";
  if (accuracy < 80) return "普通";
  return "精熟";
}
describe("weakness level", ()=>{
  it("未作答", ()=> expect(level(0,0)).toBe("未作答"));
  it("<60 高度弱點", ()=> { expect(level(59,10)).toBe("高度弱點需優先補強"); expect(level(0,2)).toBe("高度弱點需優先補強"); });
  it("60-79 普通", ()=> { expect(level(60,10)).toBe("普通"); expect(level(79,10)).toBe("普通"); });
  it(">=80 精熟", ()=> { expect(level(80,10)).toBe("精熟"); expect(level(100,10)).toBe("精熟"); });
  it("accuracy 計算", ()=>{
    const total=5, correct=3;
    const acc=Math.round(correct/total*100);
    expect(acc).toBe(60);
    expect(level(acc,total)).toBe("普通");
  });
});
