"use client";
import { useEffect, useState } from "react";
import LatexRenderer from "@/components/math/LatexRenderer";

export default function AdminClient(){
  const [subs, setSubs] = useState<any[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load(){
    setLoading(true);
    const res = await fetch("/api/submissions");
    const data = await res.json();
    setSubs(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function act(id:number, action:"APPROVE"|"REJECT"){
    setMsg("");
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action, reviewerComment: action==="REJECT" ? "感謝貢獻，經審核暫不採納" : "已審核採納，感謝貢獻！" })
    });
    const j = await res.json();
    if (res.ok) { setMsg(action==="APPROVE" ? "✅ 已採納並更新題目詳解" : "已駁回"); load(); }
    else setMsg(j.error || "操作失敗");
  }

  const filtered = subs.filter(s=> filter==="ALL" ? true : s.status===filter);

  if (loading) return <div className="py-12 text-center text-slate-400">載入審核清單...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">審核後台 · 詳解協作</h2>
        <div className="flex gap-2">
          {["PENDING","APPROVED","REJECTED","ALL"].map(f=> (
            <button key={f} onClick={()=> setFilter(f)} className={`px-3 py-1.5 text-xs rounded-lg border ${filter===f ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>{f}</button>
          ))}
        </div>
      </div>
      {msg && <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">{msg}</div>}
      {filtered.length===0 ? <div className="bg-white border rounded-xl p-8 text-center text-slate-400 text-sm">沒有 {`"${filter}"`} 的提案</div> :
        <div className="space-y-4">
          {filtered.map(s=> (
            <div key={s.id} className="bg-white border rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 rounded">題目 #{s.questionId}</span>
                <span className="px-2 py-1 bg-blue-50 rounded">{s.question?.subject?.name} — {s.question?.chapter?.name}</span>
                <span className="px-2 py-1 bg-amber-50 rounded">{s.contributorName}</span>
                <span className={`px-2 py-1 rounded ${s.status==="PENDING" ? "bg-amber-100 text-amber-800" : s.status==="APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{s.status}</span>
                <span className="text-slate-400">{new Date(s.createdAt).toLocaleString("zh-TW")}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-500 mb-1">目前正式詳解</div>
                  <div className="text-sm"><LatexRenderer content={s.question?.explanation || ""} /></div>
                  <div className="text-xs text-slate-400 mt-2">來源：{s.question?.explanationSource}</div>
                </div>
                <div className="border-2 border-amber-300 rounded-lg p-3 bg-amber-50/50">
                  <div className="text-xs font-semibold text-amber-700 mb-1">學生提交修訂版</div>
                  <div className="text-sm"><LatexRenderer content={s.proposedExplanation} /></div>
                  <div className="text-xs mt-2"><span className="font-medium">原因：</span>{s.reason}</div>
                </div>
              </div>
              {s.status==="PENDING" && (
                <div className="flex gap-3">
                  <button onClick={()=> act(s.id,"APPROVE")} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">✅ 採納通過</button>
                  <button onClick={()=> act(s.id,"REJECT")} className="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100">駁回</button>
                </div>
              )}
              {s.status!=="PENDING" && s.reviewerComment && <div className="text-xs text-slate-500">審核意見：{s.reviewerComment}</div>}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
