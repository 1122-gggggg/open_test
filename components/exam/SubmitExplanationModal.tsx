"use client";
import { useState } from "react";
import LatexRenderer from "@/components/math/LatexRenderer";

export default function SubmitExplanationModal({ questionId, currentExplanation }: { questionId:number; currentExplanation:string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [proposed, setProposed] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!name.trim() || !proposed.trim() || !reason.trim()) { setMsg("請完整填寫所有欄位"); return; }
    setStatus("sending");
    const res = await fetch("/api/submissions", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ questionId, contributorName: name, proposedExplanation: proposed, reason })
    });
    const data = await res.json();
    if (res.ok) { setStatus("done"); setMsg("已送出，等待教師審核！"); }
    else { setStatus("error"); setMsg(data.error || "送出失敗"); }
  }

  if (!open) {
    return <button onClick={()=> setOpen(true)} className="w-full py-2 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg text-sm hover:bg-amber-100">💡 發現錯誤？提交更佳詳解</button>;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex justify-between items-center">
          <h3 className="font-bold">提交更佳詳解</h3>
          <button onClick={()=> setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-medium">貢獻者姓名 / 暱稱</label>
              <input value={name} onChange={e=> setName(e.target.value)} placeholder="例如：建中陳同學" className="w-full border rounded px-3 py-2 text-sm mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">目前正式詳解（參考）</label>
              <div className="mt-1 p-3 bg-slate-50 border rounded text-sm max-h-32 overflow-auto"><LatexRenderer content={currentExplanation} /></div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">修訂後詳解（支援 Markdown + LaTeX： $...$ 與 $$...$$）</label>
            <textarea value={proposed} onChange={e=> setProposed(e.target.value)} rows={6} placeholder="請輸入更正後的完整詳解，支援 LaTeX 數學式" className="w-full border rounded px-3 py-2 text-sm mt-1 font-mono" />
            {proposed && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded">
                <div className="text-xs text-blue-700 font-medium mb-1">即時預覽：</div>
                <LatexRenderer content={proposed} className="text-sm" />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium">修改原因說明</label>
            <textarea value={reason} onChange={e=> setReason(e.target.value)} rows={2} placeholder="例如：原詳解第二步計算錯誤，應為 ..." className="w-full border rounded px-3 py-2 text-sm mt-1" />
          </div>
          {msg && <div className={`text-sm p-2 rounded ${status==="done" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
          <div className="flex gap-3">
            <button onClick={submit} disabled={status==="sending" || status==="done"} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40">
              {status==="sending" ? "送出中..." : status==="done" ? "已送出" : "送出審核"}
            </button>
            <button onClick={()=> setOpen(false)} className="px-6 py-2.5 border rounded-lg">關閉</button>
          </div>
        </div>
      </div>
    </div>
  );
}
