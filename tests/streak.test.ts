import { describe, it, expect } from "vitest";
import { computeStreak } from "@/lib/streak";
import { sanitizeUserKey } from "@/lib/user";

describe("computeStreak", () => {
  const d = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12, 0, 0);

  it("無任何打卡回 0", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("今天剛好打卡 1 天，streak=1", () => {
    const today = d(2026, 9, 6);
    expect(computeStreak([today], today)).toBe(1);
  });

  it("連續 3 天（含今天），streak=3", () => {
    const today = d(2026, 9, 6);
    const dates = [d(2026, 9, 4), d(2026, 9, 5), d(2026, 9, 6)];
    expect(computeStreak(dates, today)).toBe(3);
  });

  it("今天尚未打卡但昨天有打卡，streak 維持昨天的連續天數", () => {
    const today = d(2026, 9, 6);
    const dates = [d(2026, 9, 4), d(2026, 9, 5)];
    expect(computeStreak(dates, today)).toBe(2);
  });

  it("昨天斷簽，streak 歸零", () => {
    const today = d(2026, 9, 6);
    const dates = [d(2026, 9, 3), d(2026, 9, 4)]; // 9/5 斷
    expect(computeStreak(dates, today)).toBe(0);
  });

  it("同天多次打卡視為 1 天", () => {
    const today = d(2026, 9, 6);
    const dates = [
      d(2026, 9, 5),
      new Date(2026, 8, 5, 15, 30),
      d(2026, 9, 6),
      new Date(2026, 8, 6, 22, 10),
    ];
    expect(computeStreak(dates, today)).toBe(2);
  });

  it("支援 ISO 字串輸入與忽略 null", () => {
    const today = d(2026, 9, 6);
    expect(computeStreak(["2026-09-06T08:00:00Z", null, undefined, "invalid"], today)).toBe(1);
  });
});

describe("sanitizeUserKey", () => {
  it("合法英數底線減號通過", () => {
    expect(sanitizeUserKey("u_1234_abcd")).toBe("u_1234_abcd");
    expect(sanitizeUserKey("guest-user-01")).toBe("guest-user-01");
  });

  it("過短或過長回 legacy", () => {
    expect(sanitizeUserKey("abc")).toBe("legacy");
    expect(sanitizeUserKey("a".repeat(65))).toBe("legacy");
  });

  it("非字串或含特殊字元回 legacy", () => {
    expect(sanitizeUserKey(null)).toBe("legacy");
    expect(sanitizeUserKey(123)).toBe("legacy");
    expect(sanitizeUserKey("u<script>")).toBe("legacy");
    expect(sanitizeUserKey("u user")).toBe("legacy");
  });
});
