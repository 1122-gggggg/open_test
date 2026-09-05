// 連續天數計算（純函式，方便 vitest 單元測試）
// dates 為任意排序的 Date 或 ISO 字串；today 為基準日（預設現在）
// 規則：今天若已打卡則自今天往前算連續天數；今天尚未打卡但昨天有打卡，仍維持昨天的 streak
export function computeStreak(dates: readonly (Date | string | null | undefined)[], today: Date = new Date()): number {
  const daySet = new Set<string>();
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  for (const raw of dates) {
    if (!raw) continue;
    const d = typeof raw === "string" ? new Date(raw) : raw;
    if (!Number.isNaN(d.getTime())) daySet.add(toKey(d));
  }
  if (daySet.size === 0) return 0;

  const cur = new Date(today);
  cur.setHours(0, 0, 0, 0);
  const todayKey = toKey(cur);

  // 今天有沒有打卡？
  const todayDone = daySet.has(todayKey);
  let streak = 0;
  const runner = new Date(cur);

  if (!todayDone) {
    // 今天尚未打卡：從昨天往前驗證
    runner.setDate(runner.getDate() - 1);
  }

  while (daySet.has(toKey(runner))) {
    streak++;
    runner.setDate(runner.getDate() - 1);
  }
  return streak;
}
