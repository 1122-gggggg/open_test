/**
 * 批次匯入批次校驗並寫入資料庫
 * 支援從標準格式 JSON（大考中心 104-114 學測/指考/分科）批次寫入
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import_exam_data.ts data/exams.json
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

type ImportQ = {
  subjectCode:string; chapterCode:string; examType:string; year:number; questionNumber:number;
  questionType:string; stem:string; options:string[]; answer:string; explanation:string;
  explanationSource:string; difficulty?:number;
};

async function importFile(filePath:string){
  const raw = fs.readFileSync(filePath, "utf-8");
  const data: ImportQ[] = JSON.parse(raw);
  console.log(`Importing ${data.length} questions from ${filePath}`);
  const subjects = await prisma.subject.findMany();
  const chapters = await prisma.chapter.findMany();
  const subjMap = new Map(subjects.map(s=> [s.code, s.id]));
  const chapMap = new Map(chapters.map(c=> [c.code, c.id]));
  let ok=0, skip=0;
  for (const q of data) {
    const subjectId = subjMap.get(q.subjectCode);
    const chapterId = chapMap.get(q.chapterCode);
    if (!subjectId || !chapterId) { console.warn(`Skip unknown subject/chapter ${q.subjectCode}/${q.chapterCode}`); skip++; continue; }
    // dedup by examType+year+questionNumber+subject
    const exists = await prisma.question.findFirst({ where:{ subjectId, year: q.year, examType: q.examType, questionNumber: q.questionNumber }});
    if (exists) { console.warn(`Skip duplicate ${q.examType} ${q.year}-#${q.questionNumber}`); skip++; continue; }
    await prisma.question.create({
      data:{
        subjectId, chapterId, examType: q.examType, year: q.year, questionNumber: q.questionNumber,
        questionType: q.questionType, stem: q.stem, options: JSON.stringify(q.options || []),
        answer: q.answer, explanation: q.explanation, explanationSource: q.explanationSource, difficulty: q.difficulty || 3
      }
    });
    ok++;
  }
  console.log(`Done: ${ok} imported, ${skip} skipped`);
}

const file = process.argv[2];
if (!file) {
  console.log("Usage: ts-node scripts/import_exam_data.ts <jsonFile>");
  console.log("JSON format: [{ subjectCode, chapterCode, examType, year, questionNumber, questionType, stem, options:[], answer, explanation, explanationSource }]");
  process.exit(0);
}
importFile(file).catch(e=>{ console.error(e); process.exit(1)}).finally(()=> prisma.$disconnect());
