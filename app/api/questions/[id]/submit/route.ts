import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScheduleIfNeeded } from "@/lib/scheduler";

function scoreQuestion(questionType:string, correct:string, userSelected:string) {
  const correctSet = correct.split(",").map(s=> s.trim()).filter(Boolean);
  const userSet = userSelected.split(",").map(s=> s.trim()).filter(Boolean);
  const correctSorted = [...correctSet].sort().join(",");
  const userSorted = [...userSet].sort().join(",");
  if (questionType === "SINGLE" || questionType === "FILL_IN") {
    const ok = correctSorted === userSorted;
    return { isCorrect: ok, score: ok ? 100 : 0 };
  }
  if (questionType === "MULTIPLE" || questionType === "MIXED") {
    // 大考中心標準：全對滿分、錯一個選項得部分分，有選錯不倒扣但扣分
    // 規則：若有選到錯誤選項（不在 correctSet），則依比例扣分；全對 100
    const correctLookup = new Set(correctSet);
    const hasWrong = userSet.some(x=> !correctLookup.has(x));
    const correctCount = userSet.filter(x=> correctLookup.has(x)).length;
    const totalCorrect = correctSet.length;
    if (!hasWrong && correctCount === totalCorrect) return { isCorrect: true, score: 100 };
    if (hasWrong) {
      // 部分分：選對數量/總數 * 60，且不為 0
      // 若有錯選，最高 40 分
      const partial = Math.round((correctCount / totalCorrect) * 40);
      return { isCorrect: false, score: partial };
    } else {
      // 少選但無錯選：按比例給 60%
      const partial = Math.round((correctCount / totalCorrect) * 60);
      return { isCorrect: false, score: partial };
    }
  }
  return { isCorrect: correctSorted === userSorted, score: correctSorted===userSorted ? 100 : 0 };
}

export async function POST(req: NextRequest, { params }: { params: { id:string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error:"invalid id"}, { status:400 });
  const body = await req.json();
  const { userSelected = "", timeSpent = 0 } = body;
  const question = await prisma.question.findUnique({ where:{ id } });
  if (!question) return NextResponse.json({ error:"question not found"}, { status:404 });

  const { isCorrect, score } = scoreQuestion(question.questionType, question.answer, String(userSelected));

  await prisma.answerLog.create({
    data: {
      questionId: id,
      chapterId: question.chapterId,
      subjectId: question.subjectId,
      userSelected: String(userSelected),
      isCorrect,
      timeSpent: Number(timeSpent) || 0,
    }
  });

  // trigger scheduler if needed
  // compute chapter accuracy for this chapter
  const logs = await prisma.answerLog.findMany({ where:{ chapterId: question.chapterId } });
  const acc = logs.length ? (logs.filter(l=> l.isCorrect).length / logs.length *100) : 0;
  await triggerScheduleIfNeeded(question.chapterId, isCorrect, acc);

  return NextResponse.json({ isCorrect, score, correctAnswer: question.answer, accuracy: Math.round(acc) });
}
