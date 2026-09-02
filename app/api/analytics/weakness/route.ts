import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const logs = await prisma.answerLog.findMany({ include:{ subject:true, chapter:true }});
  const subjects = await prisma.subject.findMany({ orderBy:{ sortOrder:"asc"}});
  const chapters = await prisma.chapter.findMany({ include:{ subject:true }});

  // subject stats
  const subjectStats = subjects.map(s=> {
    const sLogs = logs.filter(l=> l.subjectId===s.id);
    const total = sLogs.length;
    const correct = sLogs.filter(l=> l.isCorrect).length;
    const accuracy = total ? Math.round(correct/total*100) : 0;
    const avgTime = total ? Math.round(sLogs.reduce((a,b)=> a+b.timeSpent,0)/total) : 0;
    let level = "精熟";
    if (total===0) level = "未作答";
    else if (accuracy < 60) level = "高度弱點需優先補強";
    else if (accuracy < 80) level = "普通";
    else level = "精熟";
    return { subjectId:s.id, subjectName:s.name, icon:s.icon, category:s.category, total, correct, accuracy, avgTime, level };
  });

  // chapter stats
  const chapterStats = chapters.map(c=> {
    const cLogs = logs.filter(l=> l.chapterId===c.id);
    const total = cLogs.length;
    const correct = cLogs.filter(l=> l.isCorrect).length;
    const accuracy = total ? Math.round(correct/total*100) : 0;
    const errorRate = total ? Math.round((1 - correct/total)*100) : 0;
    let level = "精熟";
    if (total===0) level = "未作答";
    else if (accuracy < 60) level = "高度弱點";
    else if (accuracy < 80) level = "普通";
    else level = "精熟";
    return { chapterId:c.id, chapterName:c.name, subjectName:c.subject.name, total, correct, accuracy, errorRate, level };
  }).filter(c=> c.total>0).sort((a,b)=> a.accuracy - b.accuracy);

  const topWeakness = chapterStats.slice(0,5);

  // error notebook: all incorrect logs with question
  const errorLogs = logs.filter(l=> !l.isCorrect);
  const errorQuestionIds = Array.from(new Set(errorLogs.map(l=> l.questionId)));
  const errorQuestions = errorQuestionIds.length ? await prisma.question.findMany({ where:{ id:{ in: errorQuestionIds }}, include:{ subject:true, chapter:true }}) : [];

  return NextResponse.json({ subjectStats, chapterStats, topWeakness, errorQuestions, totalLogs: logs.length });
}
