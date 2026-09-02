import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subjectCode = url.searchParams.get("subject");
  const chapterId = url.searchParams.get("chapterId");
  const examType = url.searchParams.get("examType");
  const year = url.searchParams.get("year");
  const where:any = {};
  if (chapterId) where.chapterId = Number(chapterId);
  if (examType) where.examType = examType;
  if (year) where.year = Number(year);
  // subjectCode needs join
  if (subjectCode) {
    const sub = await prisma.subject.findUnique({ where:{ code: subjectCode }});
    if (sub) where.subjectId = sub.id;
  }
  const questions = await prisma.question.findMany({ where, include:{ subject:true, chapter:true }, orderBy:[{ year:"desc"}, { questionNumber:"asc"}] });
  return NextResponse.json(questions);
}
