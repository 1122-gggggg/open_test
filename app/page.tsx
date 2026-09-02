import Link from "next/link";

const cards = [
  { title: "學習區", desc: "10大學科 · 108課綱章節樹 · YouTube 觀看數排序影片", href: "/learning", color: "bg-blue-50 border-blue-200" },
  { title: "題庫區", desc: "近十年學測/指考/分科/模考 · LaTeX 數學式 · 即時評分", href: "/exam", color: "bg-emerald-50 border-emerald-200" },
  { title: "弱點分析", desc: "雷達圖掌握度 · 錯題本 · Top5 弱點章節", href: "/analytics", color: "bg-amber-50 border-amber-200" },
  { title: "學習排程", desc: "艾賓浩斯 D+1/D+3/D+7/D+14 間隔重複", href: "/planner", color: "bg-violet-50 border-violet-200" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold">高中生全科線上學習系統</h1>
        <p className="mt-3 text-blue-100 max-w-2xl">對應 108 課綱 · 十大學科章節與 YouTube 優質教學影片 · 近十年大考試題 · 群眾協作詳解 · 弱點診斷與自主排程 — 一站式完成跨裝置學習。</p>
        <div className="mt-6 flex gap-3">
          <Link href="/learning" className="px-5 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50">開始學習 →</Link>
          <Link href="/exam" className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400">進入題庫</Link>
        </div>
      </section>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.href} href={c.href} className={`border rounded-xl p-5 hover:shadow-md transition ${c.color}`}>
            <h3 className="font-bold text-slate-800">{c.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
      <section className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white border rounded-xl p-4"><h4 className="font-semibold">📖 108課綱完整覆蓋</h4><p className="text-slate-500 mt-1">語文、數A/數B、自然四科、社會三科，高一至高三必選修章節樹。</p></div>
        <div className="bg-white border rounded-xl p-4"><h4 className="font-semibold">💡 詳解群眾協作</h4><p className="text-slate-500 mt-1">提交更佳詳解 → 教師審核採納 → 榮譽徽章與貢獻標籤。</p></div>
        <div className="bg-white border rounded-xl p-4"><h4 className="font-semibold">🎯 間隔重複排程</h4><p className="text-slate-500 mt-1">錯題自動生成 D+1/D+3/D+7/D+14 複習任務，附最高觀看數影片。</p></div>
      </section>
    </div>
  );
}
