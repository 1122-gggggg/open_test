"use client";
import { useState } from "react";
import LatexRenderer from "@/components/math/LatexRenderer";
import SubmitExplanationModal from "./SubmitExplanationModal";

type Q = {
  id:number;
  stem:string;
  options:string; // JSON string
  answer:string;
  explanation:string;
  explanationSource:string;
  authorName?:string|null;
  difficulty:number;
  examType:string; year:number; questionNumber:number; questionType:string;
  subject:{ name:string }; chapter:{ name:string };
};

export default function QuestionCard({ question }: { question: Q }) {
  const opts: string[] = (()=> { try { return JSON.parse(question.options); } catch { return []; } })();
  const [selected, setSelected] = useState<string[]>([]);
  const [fillAns, setFillAns] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect:boolean; score:number; correctAnswer:string } | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [timeStart] = useState(()=> Date.now());

  const isMultiple = question.questionType === "MULTIPLE" || question.questionType === "MIXED";
  const isFill = question.questionType === "FILL_IN";

  function toggle(opt:string) {
    const key = opt.trim().charAt(1) || opt; // "(A) ..." -> "A"
    // extract letter
    const m = opt.match(/\(([A-E0-9])\)/);
    const letter = m ? m[1] : opt;
    if (isMultiple) {
      setSelected(s=> s.includes(letter) ? s.filter(x=> x!==letter) : [...s, letter]);
    } else {
      setSelected([letter]);
    }
  }

  async function handleSubmit() {
    const userSelected = isFill ? fillAns.trim() : selected.join(",");
    const timeSpent = Math.round((Date.now() - timeStart)/1000);
    const res = await fetch(`/api/questions/${question.id}/submit`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userSelected, timeSpent })
    });
    const data = await res.json();
    setSubmitted(true);
    setResult(data);
    setShowExplain(true);
  }

  const correctSet = question.answer.split(",").map(s=> s.trim()).filter(Boolean);
  const isAnswered = isFill ? fillAns.trim().length>0 : selected.length>0;

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-slate-100 rounded">{question.subject.name}</span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{question.chapter.name}</span>
        <span className="px-2 py-1 bg-amber-50 rounded">{question.year}年 {question.examType} 第{question.questionNumber}題</span>
        <span className="px-2 py-1 bg-slate-100 rounded">{question.questionType}</span>
        <span className="px-2 py-1 bg-slate-100 rounded">難易 {question.difficulty}/5</span>
      </div>

      <div className="text-[15px] leading-relaxed">
        <LatexRenderer content={question.stem} />
      </div>

      {!isFill ? (
        <div className="space-y-2">
          {opts.map((opt, idx)=> {
            const m = opt.match(/\(([A-E0-9])\)/);
            const letter = m ? m[1] : String(idx);
            const checked = selected.includes(letter);
            return (
              <label key={idx} className={`flex gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${checked ? "border-blue-400 bg-blue-50" : ""} ${submitted ? "pointer-events-none" : ""}`}>
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={`q-${question.id}`}
                  checked={checked}
                  onChange={()=> toggle(opt)}
                  className="mt-1"
                />
                <span className="text-sm flex-1"><LatexRenderer content={opt} /></span>
              </label>
            );
          })}
        </div>
      ) : (
        <div>
          <input value={fillAns} onChange={e=> setFillAns(e.target.value)} placeholder="請輸入答案，例如 -4/5" className="w-full border rounded-lg px-3 py-2 text-sm" disabled={submitted} />
        </div>
      )}

      {!submitted ? (
        <button onClick={handleSubmit} disabled={!isAnswered} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40">送出作答</button>
      ) : (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg text-sm ${result?.isCorrect ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {result?.isCorrect ? "✅ 答對了！" : "❌ 答錯了"}　得分：{result?.score}　正確答案：<span className="font-bold">{result?.correctAnswer}</span>
          </div>
          {showExplain && (
            <div className="border rounded-lg p-4 bg-slate-50 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">詳解</h4>
                {question.authorName && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">🏆 本詳解由 @{question.authorName} 貢獻並經教師審核採納</span>}
              </div>
              <div className="text-xs text-slate-500">來源：{question.explanationSource}</div>
              <div className="text-sm leading-relaxed"><LatexRenderer content={question.explanation} /></div>
            </div>
          )}
          <SubmitExplanationModal questionId={question.id} currentExplanation={question.explanation} />
        </div>
      )}
    </div>
  );
}
