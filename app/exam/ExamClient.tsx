"use client";
import { useState, useMemo } from "react";
import QuestionCard from "@/components/exam/QuestionCard";

export default function ExamClient({ subjects, chapters, questions }: any) {
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [examTypeFilter, setExamTypeFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [chapterFilter, setChapterFilter] = useState<string>("ALL");

  const filtered = useMemo(()=> {
    return questions.filter((q:any)=> {
      if (subjectFilter!=="ALL" && q.subject.code!==subjectFilter) return false;
      if (examTypeFilter!=="ALL" && q.examType!==examTypeFilter) return false;
      if (yearFilter!=="ALL" && String(q.year)!==yearFilter) return false;
      if (chapterFilter!=="ALL" && String(q.chapterId)!==chapterFilter) return false;
      return true;
    });
  }, [questions, subjectFilter, examTypeFilter, yearFilter, chapterFilter]);

  const years = Array.from(new Set(questions.map((q:any)=> q.year))).sort((a:any,b:any)=> b-a);

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500">科目</label>
          <select value={subjectFilter} onChange={e=> setSubjectFilter(e.target.value)} className="block border rounded px-3 py-1.5 text-sm mt-1">
            <option value="ALL">全部科目</option>
            {subjects.map((s:any)=> <option key={s.id} value={s.code}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">考試類型</label>
          <select value={examTypeFilter} onChange={e=> setExamTypeFilter(e.target.value)} className="block border rounded px-3 py-1.5 text-sm mt-1">
            <option value="ALL">全部</option>
            <option value="GSAT">學測</option>
            <option value="AST">指考</option>
            <option value="AST_NEW">分科</option>
            <option value="MOCK">模考</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">年度</label>
          <select value={yearFilter} onChange={e=> setYearFilter(e.target.value)} className="block border rounded px-3 py-1.5 text-sm mt-1">
            <option value="ALL">全部年份</option>
            {years.map((y:any)=> <option key={y} value={String(y)}>{y}年</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">章節</label>
          <select value={chapterFilter} onChange={e=> setChapterFilter(e.target.value)} className="block border rounded px-3 py-1.5 text-sm mt-1">
            <option value="ALL">全部章節</option>
            {chapters.map((c:any)=> <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="text-xs text-slate-400 ml-auto">共 {filtered.length} 題</div>
      </div>

      <div className="space-y-6">
        {filtered.length===0 ? <div className="text-center py-12 text-slate-400">無符合條件題目</div> :
          filtered.map((q:any)=> <QuestionCard key={q.id} question={q} />)
        }
      </div>
    </div>
  );
}
