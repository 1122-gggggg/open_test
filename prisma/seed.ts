import { PrismaClient } from "@prisma/client";
import { subjects, chapters } from "./seeds/curriculum";
import { seedQuestions } from "./seeds/questions";
import { getFallbackVideos } from "../lib/youtube";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding start...");

  // clean
  await prisma.studyScheduleItem.deleteMany();
  await prisma.answerLog.deleteMany();
  await prisma.explanationSubmission.deleteMany();
  await prisma.tutorialVideo.deleteMany();
  await prisma.question.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.subject.deleteMany();

  // subjects
  const subjectMap = new Map<string, number>();
  for (const s of subjects) {
    const created = await prisma.subject.create({ data: s });
    subjectMap.set(s.code, created.id);
    console.log(`Subject ${s.name} -> ${created.id}`);
  }

  // chapters
  const chapterMap = new Map<string, number>();
  for (const c of chapters) {
    const subjectId = subjectMap.get(c.subjectCode)!;
    const created = await prisma.chapter.create({
      data: {
        subjectId,
        grade: c.grade,
        semester: c.semester,
        name: c.name,
        code: c.code,
        description: c.description,
        sortOrder: c.sortOrder,
      }
    });
    chapterMap.set(c.code, created.id);
  }
  console.log(`Chapters seeded: ${chapterMap.size}`);

  // videos: for each chapter, create 2-3 fallback videos
  for (const c of chapters) {
    const chapterId = chapterMap.get(c.code)!;
    const subjName = subjects.find(s=> s.code===c.subjectCode)!.name;
    const vids = getFallbackVideos(c.name);
    // ensure at least 2
    const toCreate = vids.slice(0, 2).map((v, idx)=> ({
      chapterId,
      title: v.title,
      youtubeId: vids[idx]?.youtubeId || v.youtubeId,
      channelTitle: v.channelTitle,
      viewCount: v.viewCount,
      duration: v.duration,
      thumbnailUrl: v.thumbnailUrl,
      isCurated: true,
    }));
    // fix youtubeId to original for valid embed - keep first as is
    if (toCreate[0]) toCreate[0].youtubeId = vids[0].youtubeId;
    if (toCreate[1]) toCreate[1].youtubeId = vids[1]?.youtubeId || vids[0].youtubeId;

    for (const v of toCreate) {
      await prisma.tutorialVideo.create({ data: v });
    }
  }
  console.log("Videos seeded");

  // ensure views are sorted desc per chapter - already
  // questions
  for (const q of seedQuestions) {
    const subjectId = subjectMap.get(q.subjectCode)!;
    const chapterId = chapterMap.get(q.chapterCode)!;
    await prisma.question.create({
      data: {
        subjectId,
        chapterId,
        examType: q.examType,
        year: q.year,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
        stem: q.stem,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
        explanationSource: q.explanationSource,
        authorName: q.authorName || null,
        difficulty: q.difficulty || 3,
      }
    });
  }
  console.log(`Questions seeded: ${seedQuestions.length}`);

  console.log("Seeding done");
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());
