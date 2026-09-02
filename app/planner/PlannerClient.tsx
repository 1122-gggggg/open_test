"use client";
import { useEffect, useState } from "react";
import { formatViewCount } from "@/lib/utils";
import Link from "next/link";

export default function PlannerClient(){
  const [items, setItems] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load(){
    setLoading(true);
    const res = await fetch("/api/schedule");
    const j = await res.json();
    setItems(j.items || []);
    setCompletedCount(j.completed || 0);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function complete(id:number){
    await fetch("/api/schedule", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id })});
    load();
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const todayItems = items.filter(i=> {
    const d = new Date(i.scheduledDate); d.setHours(0,0,0,0);
    return d.getTime() <= today.getTime();
  });
  const upcoming = items.filter(i=> {
    const d = new Date(i.scheduledDate); d.setHours(0,0,0,0);
    return d.getTime() > today.getTime();
  });

  const streak = completedCount; // simplified

  if (loading) return <div className="py-12 text-center text-slate-400">載入排程中...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-xl p-6">
        <h2 className="text-xl font-bold">今日學習清單 · Daily Mission</h2>
        <p className="text-violet-100 text-sm mt-1">依艾賓浩斯曲線自動生成 D+1 / D+3 / D+7 / D+14 複習任務</p>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">待完成 {todayItems.length}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">已完成 {completedCount}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">🔥 連續 {streak} 天</span>
        </div>
      </div>

      {items.length===0 ? (
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-bold">目前沒有排程任務</h3>
          <p className="text-sm text-slate-500 mt-1">在題庫區答錯題目或章節正確率低於 70% 時，會自動為你建立複習計畫</p>
          <Link href="/exam" className="inline-block mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm">去做題</Link>
        </div>
      ) : (
        <>
          <div>
            <h3 className="font-bold text-sm mb-3">📅 今日待複習 ({todayItems.length})</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {todayItems.map(item=> {
                const bestVideo = item.chapter.videos?.sort((a:any,b:any)=> b.viewCount - a.viewCount)[0];
                return (
                  <div key={item.id} className="bg-white border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-violet-600 font-medium">第 {item.repetitionStage} 階段 · D+{[1,3,7,14][item.repetitionStage-1]}</div>
                        <h4 className="font-bold text-sm mt-1">{item.chapter.subject.name} — {item.chapter.name}</h4>
                        <div className="text-xs text-slate-500">排程日：{new Date(item.scheduledDate).toLocaleDateString("zh-TW")}</div>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">待完成</span>
                    </div>
                    {bestVideo && (
                      <a href={`https://www.youtube.com/watch?v=${bestVideo.youtubeId.split("-")[0]}`} target="_blank" className="flex gap-3 p-2 bg-slate-50 border rounded-lg hover:bg-slate-100">
                        <img src={bestVideo.thumbnailUrl} alt={bestVideo.title} className="w-20 h-14 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium line-clamp-2">{bestVideo.title}</div>
                          <div className="text-xs text-slate-500">{bestVideo.channelTitle} · {formatViewCount(bestVideo.viewCount)}</div>
                        </div>
                      </a>
                    )}
                    <div className="flex gap-2">
                      <Link href="/exam" className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">📝 精選 3 題快速測驗</Link>
                      <button onClick={()=> complete(item.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">✅ 完成打卡 +XP</button>
                    </div>
                  </div>
                );
              })}
              {todayItems.length===0 && <div className="col-span-2 text-center text-sm text-slate-400 py-6">今日任務已全部完成！🎉</div>}
            </div>
          </div>

          {upcoming.length>0 && (
            <div>
              <h3 className="font-bold text-sm mb-3">🗓️ 未來排程 ({upcoming.length})</h3>
              <div className="bg-white border rounded-xl divide-y">
                {upcoming.map(item=> (
                  <div key={item.id} className="flex justify-between items-center px-4 py-3 text-sm">
                    <span>{item.chapter.subject.name} — {item.chapter.name}</span>
                    <span className="text-xs text-slate-500">{new Date(item.scheduledDate).toLocaleDateString("zh-TW")} · 階段 {item.repetitionStage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
