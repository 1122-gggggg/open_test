import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const subjects = await prisma.subject.findMany({ include:{ chapters:{ orderBy:{ sortOrder:"asc"}}}, orderBy:{ sortOrder:"asc"}});
  return NextResponse.json(subjects);
}
