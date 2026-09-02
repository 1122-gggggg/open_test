"use client";
import { useState, useEffect, useCallback } from "react";
import QuestionCard from "@/components/exam/QuestionCard";

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
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  // 搜尋即時生效：300ms debounce，避免每字元立即打 API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const buildUrl = useCallback(
    (nextCursor: number | null) => {
      const params = new URLSearchParams();
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter);
      if (chapterFilter !== "ALL") params.set("chapterId", chapterFilter);
      if (examTypeFilter !== "ALL") params.set("examType", examTypeFilter);
      if (yearFilter !== "ALL") params.set("year", yearFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("take", "20");
      if (nextCursor) params.set("cursor", String(nextCursor));
      return `/api/questions?${params.toString()}`;
    },
    [subjectFilter, chapterFilter, examTypeFilter, yearFilter, debouncedSearch]
  );

  const fetchPage = useCallback(
    async (nextCursor: number | null, isReset: boolean) => {
      setLoading(true);
      try {
        const url = buildUrl(nextCursor);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // 兼容：無 take 時回純 array；有 take 時回 {questions, nextCursor, total}
        let qs: any[] = [];
        let next: number | null = null;
        let tot: number = 0;
        if (Array.isArray(data)) {
          qs = data;
          next = null;
          tot = data.length;
          // 純 array 視為已載入全部，無更多
          setHasMore(false);
        } else if (data && Array.isArray(data.questions)) {
          qs = data.questions;
          // PagApi 規格：nextCursor 可能為 number|null
          next = data.nextCursor ?? data.next_cursor ?? null;
          // 若 nextCursor 為 undefined 且有 hasMore 旗標
          if (next === undefined && typeof data.hasMore === "boolean") {
            next = data.hasMore ? qs[qs.length - 1]?.id ?? null : null;
          }
          tot = typeof data.total === "number" ? data.total : qs.length;
          setHasMore(next !== null && next !== undefined);
        } else if (data && Array.isArray(data.data)) {
          qs = data.data;
          next = data.nextCursor ?? null;
          tot = typeof data.total === "number" ? data.total : qs.length;
          setHasMore(next !== null);
        } else {
          qs = [];
          tot = 0;
          setHasMore(false);
        }

        if (isReset) {
          setQuestions(qs);
        } else {
          setQuestions((prev) => [...prev, ...qs]);
        }
        setCursor(next);
        setTotal(tot);
        // 首次載入後標記，避免初始閃爍
        if (isReset) setInitialLoaded(true);
        // 若回傳筆數 < take 且 next 為空，確保 hasMore 關閉
        if (qs.length === 0 || (next === null && Array.isArray(data) === false)) {
          // hasMore 已在上方設定
        }
        // 非 array 情況下，若 qs 長度 < 20 且 next 為 null，hasMore 已為 false
      } catch (e) {
        console.error("[ExamClient] fetch failed", e);
        if (isReset) {
          setQuestions([]);
          setTotal(0);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
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
        {/* 列印考卷 - 僅螢幕顯示，列印時隱藏 */}
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
        ) : questions.length===0 ? (
          <div className="text-center py-12 text-slate-400">
            {initialLoaded ? "無符合條件題目" : "載入中…"}
          </div>
        ) : (
          questions.map((q:any)=> <QuestionCard key={q.id} question={q} />)
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
