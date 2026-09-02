import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scheduleCompleteSchema } from "@/lib/validations";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  // query today's schedule items
  const start = new Date(targetDate); start.setHours(0,0,0,0);
  const end = new Date(targetDate); end.setHours(23,59,59,999);
  // For simplicity, return all pending items, highlight today
  const items = await prisma.studyScheduleItem.findMany({
    where:{ isCompleted:false },
    include:{ chapter:{ include:{ subject:true, videos:true } } },
    orderBy:{ scheduledDate:"asc" }
  });
  // also compute streak: count consecutive days with completed items? simplified as total completed
  const completed = await prisma.studyScheduleItem.count({ where:{ isCompleted:true }});
  return NextResponse.json({ items, completed, date: targetDate.toISOString() });
}
export async function POST(req: Request) {
  const body = await req.json();
  // zod 驗證：id 必須為正整數，失敗回 400
  const parsed = scheduleCompleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status:400 });
  const { id } = parsed.data;
  const updated = await prisma.studyScheduleItem.update({ where:{ id: Number(id)}, data:{ isCompleted:true }});
  return NextResponse.json({ ok:true, item: updated });
}
