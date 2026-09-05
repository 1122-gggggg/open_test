import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scheduleCompleteSchema } from "@/lib/validations";
import { getUserKeyFromHeaders } from "@/lib/user";
import { computeStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userKey = getUserKeyFromHeaders(req.headers);
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const targetDate = dateParam ? new Date(dateParam) : new Date();

  // 限制未完成項目最多取 100 筆，避免無界成長
  const items = await prisma.studyScheduleItem.findMany({
    where: { isCompleted: false, userKey },
    include: { chapter: { include: { subject: true, videos: true } } },
    orderBy: { scheduledDate: "asc" },
    take: 100,
  });

  // 真實連續打卡：撈該 userKey 最近 60 天的 completedAt 計算 streak
  const [completed, completedRows] = await Promise.all([
    prisma.studyScheduleItem.count({ where: { isCompleted: true, userKey } }),
    prisma.studyScheduleItem.findMany({
      where: { isCompleted: true, userKey, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 200,
    }),
  ]);
  const streak = computeStreak(completedRows.map((r) => r.completedAt), targetDate);

  return NextResponse.json({ items, completed, streak, date: targetDate.toISOString() });
}

export async function POST(req: NextRequest) {
  const userKey = getUserKeyFromHeaders(req.headers);
  const body = await req.json();
  // zod 驗證：id 必須為正整數，失敗回 400
  const parsed = scheduleCompleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const { id } = parsed.data;
  const item = await prisma.studyScheduleItem.findUnique({ where: { id: Number(id) } });
  if (!item) return NextResponse.json({ error: "排程項目不存在" }, { status: 404 });
  // 權限：若非 legacy 且不符當前 userKey 則拒絕
  if (item.userKey !== "legacy" && item.userKey !== userKey) {
    return NextResponse.json({ error: "無權操作此排程" }, { status: 403 });
  }
  const updated = await prisma.studyScheduleItem.update({
    where: { id: Number(id) },
    data: { isCompleted: true, completedAt: new Date() },
  });
  return NextResponse.json({ ok: true, item: updated });
}
