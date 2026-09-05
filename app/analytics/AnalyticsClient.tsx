"use client";
import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import LatexRenderer from "@/components/math/LatexRenderer";
import Link from "next/link";
import { userFetch } from "@/lib/clientUser";

export default function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"weakness"|"errors">("weakness");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await userFetch("/api/analytics/weakness");
    const j = await res.json();
    setData(j);
    setLoading(false);
  }
  useEffect(()=> { load(); }, []);

  if (loading) return <div className="py-12 text-center text-slate-400">載入分析中...</div>;
  if (!data) return <div>無資料</div>;

  const radarData = data.subjectStats.filter((s:any)=> s.total>0).map((s:any)=> ({ subject: s.subjectName, A: s.accuracy, fullMark: 100 }));

  // if no logs, show empty radar with all subjects 0
  const displayRadar = radarData.length ? radarData : data.subjectStats.map((s:any)=> ({ subject:s.subjectName, A:0, fullMark:100 }));

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={()=> setTab("weakness")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==="weakness" ? "bg-blue-600 text-white" : "bg-white border"}`}>弱點分析</button>
        <button onClick={()=> setTab("errors")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==="errors" ? "bg-blue-600 text-white" : "bg-white border"}`}>錯題本 ({data.errorQuestions?.length || 0})</button>
        <button onClick={load} className="ml-auto px-3 py-2 text-xs border rounded-lg bg-white">重新整理</button>
      </div>

      {tab==="weakness" ? (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-3">科目掌握度雷達圖</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={displayRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:10 }} />
                    <Radar name="掌握度" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                {data.subjectStats.map((s:any)=> (
                  <div key={s.subjectId} className="flex justify-between border rounded px-2 py-1 bg-slate-50">
                    <span>{s.icon} {s.subjectName}</span>
                    <span className={`font-bold ${s.accuracy<60 ? "text-red-600" : s.accuracy<80 ? "text-amber-600" : "text-emerald-600"}`}>{s.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-3">弱點章節排行榜 Top 5</h3>
              {data.topWeakness.length===0 ? <div className="text-sm text-slate-400 py-8 text-center">尚無作答紀錄，去 <Link href="/exam" className="text-blue-600 underline">題庫區</Link> 開始作答吧！</div> :
                <div className="space-y-3">
                  {data.topWeakness.map((c:any, idx:number)=> (
                    <div key={c.chapterId} className="flex items-center gap-3 border rounded-lg p-3 hover:bg-slate-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx===0 ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>{idx+1}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.chapterName} <span className="text-xs text-slate-500">({c.subjectName})</span></div>
                        <div className="text-xs text-slate-500">答對率 {c.accuracy}% · 錯誤率 {c.errorRate}% · 作答 {c.total} 題</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${c.level.includes("弱點") ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{c.level}</span>
                      <Link href="/exam" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">立即加強</Link>
                    </div>
                  ))}
                </div>
              }
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-600 mb-2">各章節掌握度</h4>
                <div className="space-y-1 max-h-64 overflow-auto text-xs">
                  {data.chapterStats.map((c:any)=> (
                    <div key={c.chapterId} className="flex justify-between border-b py-1">
                      <span>{c.chapterName}</span>
                      <span className={c.accuracy<60 ? "text-red-600 font-bold" : c.accuracy<80 ? "text-amber-600" : "text-emerald-600"}>{c.accuracy}% ({c.total}題)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-sm font-bold">學習建議</h3>
            <p className="text-sm text-slate-600 mt-2">
              系統依答題數據判定：<span className="font-medium text-red-600">&lt;60% 高度弱點需優先補強</span>、60–80% 普通、&gt;80% 精熟。
              點擊「立即加強」前往題庫針對該章節補強，連續答錯 2 題將自動在 <Link href="/planner" className="text-blue-600 underline">學習排程</Link> 生成 D+1/D+3/D+7/D+14 間隔複習任務。
            </p>
          </div>
        </>
      ) : (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-sm mb-3">錯題本</h3>
          {data.errorQuestions.length===0 ? <div className="text-sm text-slate-400 py-8 text-center">太棒了！目前沒有錯題</div> :
            <div className="space-y-4">
              {data.errorQuestions.map((q:any)=> (
                <div key={q.id} className="border rounded-lg p-4">
                  <div className="text-xs text-slate-500 flex gap-2"><span>{q.subject.name}</span><span>{q.chapter.name}</span><span>{q.year}年 {q.examType} #{q.questionNumber}</span></div>
                  <div className="text-sm mt-2"><LatexRenderer content={q.stem} /></div>
                  <div className="text-xs mt-2 text-slate-500">正解：{q.answer}</div>
                  <div className="text-sm mt-2 p-3 bg-slate-50 rounded"><LatexRenderer content={q.explanation} /></div>
                  <Link href="/exam" className="inline-block mt-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">重新挑戰</Link>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}
