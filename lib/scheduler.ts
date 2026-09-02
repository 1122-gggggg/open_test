import { prisma } from "./db";

const INTERVALS = [1, 3, 7, 14]; // D+1, D+3, D+7, D+14

export async function createOrUpdateStudyPlan(chapterId: number) {
  const now = new Date();
  // clear incomplete future items for this chapter? keep history, just add missing stages
  const existing = await prisma.studyScheduleItem.findMany({ where: { chapterId } });
  const existingStages = new Set(existing.map(e=> e.repetitionStage));

  const toCreate: { chapterId:number; scheduledDate:Date; repetitionStage:number }[] = [];
  for (let i=0;i<INTERVALS.length;i++) {
    const stage = i+1;
    if (existingStages.has(stage)) continue;
    const d = new Date(now);
    d.setDate(d.getDate() + INTERVALS[i]);
    // normalize to midnight
    d.setHours(9,0,0,0);
    toCreate.push({ chapterId, scheduledDate: d, repetitionStage: stage });
  }
  if (toCreate.length>0) {
    await prisma.studyScheduleItem.createMany({ data: toCreate });
  }
  return toCreate.length;
}

export async function triggerScheduleIfNeeded(chapterId: number, isCorrect: boolean, chapterAccuracy?: number) {
  // trigger if answered incorrectly or accuracy <70%
  if (!isCorrect || (chapterAccuracy !== undefined && chapterAccuracy < 70)) {
    await createOrUpdateStudyPlan(chapterId);
  }
}

export function getIntervals() { return INTERVALS; }
