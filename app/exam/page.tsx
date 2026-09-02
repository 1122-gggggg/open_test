import { prisma } from "@/lib/db";
import ExamClient from "./ExamClient";

export const dynamic = "force-dynamic";

export default async function ExamPage() {
  const subjects = await prisma.subject.findMany({ orderBy:{ sortOrder:"asc"}});
  const questions = await prisma.question.findMany({
    include:{ subject:true, chapter:true },
    orderBy:[{ year:"desc"}, { questionNumber:"asc"}]
  });
  const chapters = await prisma.chapter.findMany({ orderBy:{ sortOrder:"asc"}});
  return <ExamClient subjects={subjects} chapters={chapters} questions={questions} />;
}
