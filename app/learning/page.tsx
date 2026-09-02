import { prisma } from "@/lib/db";
import LearningClient from "./LearningClient";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const subjects = await prisma.subject.findMany({
    orderBy:{ sortOrder:"asc"},
    include:{ chapters:{ orderBy:{ sortOrder:"asc"}}}
  });
  // preload videos for each chapter
  const chaptersWithVideos = await prisma.chapter.findMany({
    include:{ videos:true }
  });
  const videosByChapter: Record<number, any[]> = {};
  for (const c of chaptersWithVideos) videosByChapter[c.id] = c.videos;

  return <LearningClient subjects={subjects} videosByChapter={videosByChapter} />;
}
