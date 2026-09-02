import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();
async function main(){
  const dir = path.join(__dirname, "../prisma/seeds/generated");
  const files = fs.readdirSync(dir).filter(f=> f.endsWith(".json"));
  console.log(`Found ${files.length} files`);
  const subjects = await prisma.subject.findMany();
  const chapters = await prisma.chapter.findMany();
  const subjMap = new Map(subjects.map(s=>[s.code, s.id]));
  const chapMap = new Map(chapters.map(c=>[c.code, c.id]));
  let total=0, ok=0, skip=0, err=0;
  for(const file of files){
    const raw = fs.readFileSync(path.join(dir,file),"utf-8");
    const data: any[] = JSON.parse(raw);
    total+=data.length;
    for(const q of data){
      const subjectId = subjMap.get(q.subjectCode);
      const chapterId = chapMap.get(q.chapterCode);
      if(!subjectId || !chapterId){ console.warn(`Skip unknown ${q.subjectCode}/${q.chapterCode}`); skip++; continue; }
      const exists = await prisma.question.findFirst({ where:{ subjectId, year: q.year, examType: q.examType, questionNumber: q.questionNumber }});
      if(exists){ skip++; continue; }
      try{
        await prisma.question.create({
          data:{
            subjectId, chapterId, examType: q.examType, year: q.year, questionNumber: q.questionNumber,
            questionType: q.questionType, stem: q.stem, options: JSON.stringify(q.options||[]),
            answer: q.answer, explanation: q.explanation, explanationSource: q.explanationSource, difficulty: q.difficulty||3
          }
        });
        ok++;
      } catch(e:any){ console.error("insert err",e.message); err++; }
    }
    console.log(` ${file}: ${data.length} -> ok ${ok} skip ${skip}`);
  }
  console.log(`Done total ${total} imported ${ok} skipped ${skip} err ${err}`);
  const counts = await prisma.question.groupBy({ by:["subjectId"], _count:{ id:true }});
  for(const c of counts){ const s=subjects.find(x=> x.id===c.subjectId); console.log(s?.name, s?.code, c._count.id); }
  console.log("total questions", await prisma.question.count());
}
main().catch(e=>{ console.error(e); process.exit(1)}).finally(()=> prisma.$disconnect());
