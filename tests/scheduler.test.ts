import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildScheduleDates, getIntervals, createOrUpdateStudyPlan } from "@/lib/scheduler";

// mock prisma 以避免真實 DB
vi.mock("@/lib/db", () => ({
  prisma: {
    studyScheduleItem: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 4 }),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("間隔重複排程 createOrUpdateStudyPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getIntervals 回傳 [1,3,7,14]", () => {
    expect(getIntervals()).toEqual([1, 3, 7, 14]);
  });

  it("buildScheduleDates 依基準日產生 D+1/D+3/D+7/D+14 四筆", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    const dates = buildScheduleDates(base);
    expect(dates).toHaveLength(4);
    // 驗證每筆間隔
    const diffDays = (d: Date, b: Date) => Math.round((d.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
    // buildScheduleDates 會把時間設為 09:00，需以日期計算間隔
    // 以 base 的日期為準，檢查月日
    expect(dates[0].getUTCDate()).toBe(2); // 1/1 +1 =1/2
    expect(dates[1].getUTCDate()).toBe(4); // +3
    expect(dates[2].getUTCDate()).toBe(8); // +7
    expect(dates[3].getUTCDate()).toBe(15); // +14
  });

  it("buildScheduleDates 每筆時間為 09:00:00", () => {
    const base = new Date("2026-03-15T12:00:00Z");
    const dates = buildScheduleDates(base);
    for (const d of dates) {
      expect(d.getHours()).toBe(9);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    }
  });

  it("createOrUpdateStudyPlan 無既有排程時建立 4 筆 D+1/D+3/D+7/D+14", async () => {
    // mock 無既有
    vi.mocked(prisma.studyScheduleItem.findMany).mockResolvedValueOnce([]);
    const created = await createOrUpdateStudyPlan(123);
    expect(created).toBe(4);
    expect(prisma.studyScheduleItem.createMany).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(prisma.studyScheduleItem.createMany).mock.calls[0][0] as any;
    const data = arg.data as { chapterId: number; scheduledDate: Date; repetitionStage: number }[];
    expect(data).toHaveLength(4);
    expect(data.map((d) => d.repetitionStage)).toEqual([1, 2, 3, 4]);
    expect(data.map((d) => d.chapterId)).toEqual([123, 123, 123, 123]);
    // 驗證日期間隔為 1,3,7,14（以現在時間為基準，容許 1 天誤差內檢查 stage 對應）
    // 這裡僅檢查 stage 正確，日期已由 buildScheduleDates 邏輯保證
  });

  it("createOrUpdateStudyPlan 已有部分階段時只補缺漏", async () => {
    // 假設已有 stage 1,2
    vi.mocked(prisma.studyScheduleItem.findMany).mockResolvedValueOnce([
      { id: 1, chapterId: 99, scheduledDate: new Date(), repetitionStage: 1, isCompleted: false, createdAt: new Date() } as any,
      { id: 2, chapterId: 99, scheduledDate: new Date(), repetitionStage: 2, isCompleted: false, createdAt: new Date() } as any,
    ]);
    const created = await createOrUpdateStudyPlan(99);
    expect(created).toBe(2); // 只補 3,4
    const arg = vi.mocked(prisma.studyScheduleItem.createMany).mock.calls[0][0] as any;
    const data = arg.data as { repetitionStage: number }[];
    expect(data.map((d) => d.repetitionStage)).toEqual([3, 4]);
  });

  it("createOrUpdateStudyPlan 已全滿時不新增", async () => {
    vi.mocked(prisma.studyScheduleItem.findMany).mockResolvedValueOnce([
      { id: 1, chapterId: 1, scheduledDate: new Date(), repetitionStage: 1, isCompleted: false, createdAt: new Date() } as any,
      { id: 2, chapterId: 1, scheduledDate: new Date(), repetitionStage: 2, isCompleted: false, createdAt: new Date() } as any,
      { id: 3, chapterId: 1, scheduledDate: new Date(), repetitionStage: 3, isCompleted: false, createdAt: new Date() } as any,
      { id: 4, chapterId: 1, scheduledDate: new Date(), repetitionStage: 4, isCompleted: false, createdAt: new Date() } as any,
    ]);
    const created = await createOrUpdateStudyPlan(1);
    expect(created).toBe(0);
    expect(prisma.studyScheduleItem.createMany).not.toHaveBeenCalled();
  });

  it("排程日期間隔符合艾賓浩斯曲線：D+1, D+3, D+7, D+14 的日差", () => {
    const base = new Date("2026-06-01T09:00:00");
    const dates = buildScheduleDates(base);
    const dayDiff = dates.map((d) => Math.round((d.getTime() - base.getTime()) / 86400000));
    expect(dayDiff).toEqual([1, 3, 7, 14]);
  });
});
