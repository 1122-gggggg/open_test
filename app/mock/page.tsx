import { prisma } from "@/lib/db";
import MockClient from "./MockClient";

export const dynamic = "force-dynamic";

export default async function MockPage() {
  const subjects = await prisma.subject.findMany({ orderBy: { sortOrder: "asc" } });
  const chapters = await prisma.chapter.findMany({ orderBy: { sortOrder: "asc" } });
  return <MockClient subjects={subjects} chapters={chapters} />;
}
