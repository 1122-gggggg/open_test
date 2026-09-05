  "use client";
  import { useState, useEffect, useCallback, useRef } from "react";
  import QuestionCard from "@/components/exam/QuestionCard";
  import { safeLocalStorage } from "@/lib/storage";

// 年份選項：涵蓋 100~115（民國年），避免依賴全量 questions 推導，保持分頁後仍可篩選
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => 115 - i); // 115..100

export default function ExamClient({ subjects, chapters }: any) {
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [examTypeFilter, setExamTypeFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [chapterFilter, setChapterFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [questions, setQuestions] = useState<any[]>([]);
  // keyset cursor：新版為 `${year}:${id}` 字串；舊數字 id 仍相容（server 端解析）
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [favorites, setFavorites] = useState<number[]>(()=> safeLocalStorage.getJSON<number[]>("favorites", []));
  const [showFavOnly, setShowFavOnly] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  // 搜尋即時生效：300ms debounce，避免每字元立即打 API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(()=>{ safeLocalStorage.setJSON("favorites", favorites); }, [favorites]);
  const toggleFav = (id:number)=> setFavorites(f=> f.includes(id) ? f.filter(x=> x!==id) : [...f, id]);
  const buildUrl = useCallback(
    (nextCursor: string | null) => {
      const params = new URLSearchParams();
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter);
      if (chapterFilter !== "ALL") params.set("chapterId", chapterFilter);
      if (examTypeFilter !== "ALL") params.set("examType", examTypeFilter);
      if (yearFilter !== "ALL") params.set("year", yearFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("take", "20");
      if (nextCursor) params.set("cursor", nextCursor);
      return `/api/questions?${params.toString()}`;
    },
    [subjectFilter, chapterFilter, examTypeFilter, yearFilter, debouncedSearch]
  );

  // 請求序號：篩選快速切換時丟棄過期回應，避免後發先至覆蓋新結果
  const reqSeq = useRef(0);
  const fetchPage = useCallback(
    async (nextCursor: string | null, isReset: boolean) => {
      const mySeq = ++reqSeq.current;
      setLoading(true);
      try {
        const url = buildUrl(nextCursor);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (reqSeq.current !== mySeq) return; // 過期回應直接丟棄

        // 兼容：無 take 時回純 array；有 take 時回 {questions, nextCursor, total, hasMore}
        let qs: any[] = [];
        let next: string | null = null;
        let tot: number = 0;
        let more: boolean = false;
        if (Array.isArray(data)) {
          qs = data;
          tot = data.length;
        } else if (data && Array.isArray(data.questions)) {
          qs = data.questions;
          const rawNext = data.nextCursor ?? data.next_cursor ?? null;
          next = rawNext === undefined || rawNext === null ? null : String(rawNext);
          tot = typeof data.total === "number" ? data.total : qs.length;
          // server 新版直接給 hasMore；舊回應則以 nextCursor 是否存在推斷
          more = typeof data.hasMore === "boolean" ? data.hasMore : next !== null;
        } else if (data && Array.isArray(data.data)) {
          qs = data.data;
          const rawNext = data.nextCursor ?? null;
          next = rawNext === undefined || rawNext === null ? null : String(rawNext);
          tot = typeof data.total === "number" ? data.total : qs.length;
          more = typeof data.hasMore === "boolean" ? data.hasMore : next !== null;
        } else {
          qs = [];
          tot = 0;
          more = false;
        }

        if (isReset) {
          setQuestions(qs);
        } else {
          // 去重合併：keyset 邊界下 server 不會重疊，但舊 cursor 混用時以 id 去重保底
          setQuestions((prev) => {
            const seen = new Set(prev.map((q: any) => q.id));
            return [...prev, ...qs.filter((q: any) => !seen.has(q.id))];
          });
        }
        setCursor(next);
        setTotal(tot);
        setHasMore(more);
        // 首次載入後標記，避免初始閃爍
        if (isReset) setInitialLoaded(true);
      } catch (e) {
        if (reqSeq.current !== mySeq) return;
        console.error("[ExamClient] fetch failed", e);
        if (isReset) {
          setQuestions([]);
          setTotal(0);
        }
        setHasMore(false);
      } finally {
        if (reqSeq.current === mySeq) setLoading(false);
      }
    },
    [buildUrl]
  );

  // 篩選/search 變動時 reset 並抓首頁
  useEffect(() => {
    // 參數變動時清空並重抓
    setCursor(null);
    setHasMore(true);
    fetchPage(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, examTypeFilter, yearFilter, chapterFilter, debouncedSearch]);

  const handleLoadMore = () => {
    if (loading || !hasMore || cursor === null) return;
    fetchPage(cursor, false);
  };

  // 章節下拉依科目過濾（保留原有全部，若選科目則僅顯示該科章節，避免過長）
  const visibleChapters = subjectFilter === "ALL"
    ? chapters
    : chapters.filter((c: any) => {
        const sub = subjects.find((s: any) => s.code === subjectFilter);
        return sub ? c.subjectId === sub.id : true;
      });
  // 收藏篩選為前端過濾（僅作用於已載入題目，避免收藏分散各頁時需全表掃描）
  const favSet = new Set(favorites);
  const visibleQuestions = showFavOnly ? questions.filter((q: any) => favSet.has(q.id)) : questions;

  return (
    <div className="space-y-4">
      {/* 篩選區 - 列印時隱藏 */}
      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end exam-filters no-print">
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
            {YEAR_OPTIONS.map((y:any)=> <option key={y} value={String(y)}>{y}年</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">章節</label>
          <select value={chapterFilter} onChange={e=> setChapterFilter(e.target.value)} className="block border rounded px-3 py-1.5 text-sm mt-1">
            <option value="ALL">全部章節</option>
            {visibleChapters.map((c:any)=> <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px] max-w-[320px]">
          <label className="text-xs text-slate-500">搜尋</label>
          <input
            value={search}
            onChange={e=> setSearch(e.target.value)}
            placeholder="搜尋題幹或來源關鍵字…"
            className="block w-full border rounded px-3 py-1.5 text-sm mt-1 placeholder:text-slate-400"
          />
        </div>
        {/* 收藏篩選與列印 - 僅螢幕顯示，列印時隱藏 */}
        <button
          onClick={() => setShowFavOnly((v) => !v)}
          aria-pressed={showFavOnly}
          aria-label="只看收藏題目"
          title="僅顯示已收藏題目（以已載入題目為範圍）"
          className={`px-4 py-1.5 rounded-md text-sm border transition no-print ${showFavOnly ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white hover:bg-slate-50"}`}
        >
          {showFavOnly ? "★ 只看收藏" : "☆ 只看收藏"}（{favorites.length}）
        </button>
        <button
          onClick={() => window.print()}
          aria-label="列印考卷"
          className="ml-auto px-4 py-1.5 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-900 transition no-print"
        >
          🖨️ 列印考卷
        </button>
        <div className="text-xs text-slate-500 w-full sm:w-auto sm:ml-2 flex flex-col items-end gap-0.5">
          <span>共 {total} 題</span>
          <span>已載入 {questions.length} 題</span>
        </div>
      </div>

      {/* 題目列表 - 列印時僅顯示此區域 */}
      <div className="space-y-6 exam-print-area print-area">
        {loading && questions.length===0 ? (
          <div className="text-center py-12 text-slate-400">載入中…</div>
        ) : visibleQuestions.length===0 ? (
          <div className="text-center py-12 text-slate-400">
            {initialLoaded ? (showFavOnly ? "已載入題目中尚無收藏，可先點題目右上角 ☆ 收藏" : "無符合條件題目") : "載入中…"}
          </div>
        ) : (
          visibleQuestions.map((q:any)=> <QuestionCard key={q.id} question={q} isFav={favorites.includes(q.id)} onToggleFav={()=> toggleFav(q.id)} />)
        )}
      </div>

      {questions.length>0 && (
        <div className="flex justify-center py-4 no-print">
          {hasMore ? (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed no-print"
            >
              {loading ? "載入中…" : "載入更多"}
            </button>
          ) : (
            <span className="text-xs text-slate-400 py-2">已全部載入（共 {total} 題，已顯示 {questions.length} 題）</span>
          )}
        </div>
      )}
    </div>
  );
}
