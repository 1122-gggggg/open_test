"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LatexRenderer from "@/components/math/LatexRenderer";
import { safeLocalStorage } from "@/lib/storage";
import { formatCountdown } from "@/lib/mock";
import { userFetch } from "@/lib/clientUser";

interface SubjectOpt {
  id: number;
  code: string;
  name: string;
}

interface ChapterOpt {
  id: number;
  subjectId: number;
  name: string;
}

interface PaperQuestion {
  id: number;
  subject: { name: string };
  chapter: { name: string };
  examType: string;
  year: number;
  questionNumber: number;
  questionType: string;
  stem: string;
  options: string;
  difficulty: number;
}

interface ReviewItem {
  questionId: number;
  userSelected: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  stem: string;
  options: string;
  explanation: string;
  explanationSource: string;
  questionType: string;
  year?: number;
  examType?: string;
}

interface MockReport {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  total: number;
  accuracy: number;
  items: ReviewItem[];
}

type Phase = "setup" | "answering" | "result";

const COUNT_OPTIONS = [10, 20, 30, 50];
const MINUTE_OPTIONS = [0, 20, 30, 60, 90]; // 0 = 不計時
const DRAFT_KEY = "mock-draft";

interface Draft {
  questions: PaperQuestion[];
  choices: Record<string, string[]>;
  fills: Record<string, string>;
  deadline: number;
  startedAt: number;
}

function parseOptions(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function letterOf(opt: string, fallback: string): string {
  const m = opt.match(/\(([A-E])\)/);
  return m ? m[1] : fallback;
}

export default function MockClient({ subjects, chapters }: { subjects: SubjectOpt[]; chapters: ChapterOpt[] }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [examTypeFilter, setExamTypeFilter] = useState<string>("ALL");
  const [count, setCount] = useState<number>(20);
  const [minutes, setMinutes] = useState<number>(30);

  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [fills, setFills] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MockReport | null>(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const autoSubmitted = useRef(false);

  // 有未完成草稿時提示續考
  useEffect(() => {
    const d = safeLocalStorage.getJSON<Draft | null>(DRAFT_KEY, null);
    if (d && Array.isArray(d.questions) && d.questions.length > 0) setHasDraft(true);
  }, []);

  const visibleChapters = useMemo(() => {
    if (subjectFilter === "ALL") return chapters;
    const sub = subjects.find((s) => s.code === subjectFilter);
    return sub ? chapters.filter((c) => c.subjectId === sub.id) : chapters;
  }, [subjectFilter, subjects, chapters]);

  const current = questions[index];
  const isMulti = current?.questionType === "MULTIPLE" || current?.questionType === "MIXED";
  const isFill = current?.questionType === "FILL_IN";

  function answeredCount(): number {
    return questions.filter((q) => {
      if (q.questionType === "FILL_IN") return (fills[String(q.id)] ?? "").trim().length > 0;
      return (choices[String(q.id)] ?? []).length > 0;
    }).length;
  }

  function toggleChoice(qid: number, letter: string, multi: boolean) {
    const key = String(qid);
    setChoices((prev) => {
      const cur = prev[key] ?? [];
      if (multi) {
        return { ...prev, [key]: cur.includes(letter) ? cur.filter((x) => x !== letter) : [...cur, letter] };
      }
      return { ...prev, [key]: [letter] };
    });
  }

  async function startPaper() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter);
      if (examTypeFilter !== "ALL") params.set("examType", examTypeFilter);
      params.set("count", String(count));
      const res = await fetch(`/api/mock?${params.toString()}`, { cache: "no-store" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error("組卷失敗，請重試");
      const qs =
        typeof data === "object" && data !== null && "questions" in data && Array.isArray(data.questions)
          ? (data.questions as PaperQuestion[])
          : [];
      if (qs.length === 0) {
        setError("符合條件的題目不足，請放寬篩選後重試");
        return;
      }
      const dl = minutes > 0 ? Date.now() + minutes * 60_000 : 0;
      setQuestions(qs);
      setChoices({});
      setFills({});
      setIndex(0);
      setDeadline(dl);
      setNow(Date.now());
      setReport(null);
      setShowWrongOnly(false);
      autoSubmitted.current = false;
      setPhase("answering");
      setHasDraft(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "組卷失敗，請重試");
    } finally {
      setLoading(false);
    }
  }

  function resumeDraft() {
    const d = safeLocalStorage.getJSON<Draft | null>(DRAFT_KEY, null);
    if (!d || !Array.isArray(d.questions) || d.questions.length === 0) return;
    setQuestions(d.questions);
    setChoices(d.choices ?? {});
    setFills(d.fills ?? {});
    setIndex(0);
    setDeadline(d.deadline ?? 0);
    setNow(Date.now());
    setReport(null);
    setShowWrongOnly(false);
    autoSubmitted.current = false;
    setPhase("answering");
    setHasDraft(false);
  }

  function discardDraft() {
    safeLocalStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }

  // 作答中自動存檔（含死線，重新整理可續考）
  useEffect(() => {
    if (phase !== "answering" || questions.length === 0) return;
    safeLocalStorage.setJSON(DRAFT_KEY, {
      questions,
      choices,
      fills,
      deadline,
      startedAt: Date.now(),
    } satisfies Draft);
  }, [phase, questions, choices, fills, deadline]);

  // 倒數計時；歸零自動交卷一次
  useEffect(() => {
    if (phase !== "answering" || deadline === 0) return;
    const t = setInterval(() => {
      const t2 = Date.now();
      setNow(t2);
      if (t2 >= deadline && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void submitPaper(true);
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

  const submitPaper = useCallback(
    async (auto = false) => {
      if (submitting) return;
      if (!auto && questions.length > 0 && answeredCount() < questions.length) {
        const ok = window.confirm(`尚有 ${questions.length - answeredCount()} 題未作答，確定交卷？`);
        if (!ok) return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const answers: Record<string, string> = {};
        for (const q of questions) {
          if (q.questionType === "FILL_IN") answers[String(q.id)] = (fills[String(q.id)] ?? "").trim();
          else answers[String(q.id)] = (choices[String(q.id)] ?? []).join(",");
        }
        const res = await userFetch("/api/mock/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        const data: unknown = await res.json();
        if (!res.ok) throw new Error("交卷失敗，請重試");
        setReport(data as MockReport);
        setPhase("result");
        safeLocalStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        setError(e instanceof Error ? e.message : "交卷失敗，請重試");
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, choices, fills, submitting]
  );

  function quitToSetup() {
    safeLocalStorage.removeItem(DRAFT_KEY);
    setPhase("setup");
    setQuestions([]);
    setReport(null);
  }

  const remaining = deadline === 0 ? 0 : Math.max(0, Math.floor((deadline - now) / 1000));
  const reviewItems = report && showWrongOnly ? report.items.filter((i) => !i.isCorrect) : (report?.items ?? []);

  if (phase === "setup") {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-xl p-6">
          <h1 className="text-xl font-bold">模擬考</h1>
          <p className="text-sm text-blue-100 mt-1">隨機組卷 · 計時作答 · 交卷即出成績與逐題詳解</p>
        </div>
        {hasDraft && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm flex flex-wrap gap-2 items-center">
            <span>偵測到未完成的模擬考草稿，可繼續作答。</span>
            <button onClick={resumeDraft} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm">繼續作答</button>
            <button onClick={discardDraft} className="px-3 py-1.5 border rounded-lg text-sm bg-white">捨棄</button>
          </div>
        )}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">科目</label>
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="block w-full border rounded px-3 py-2 text-sm mt-1">
                <option value="ALL">全部科目（綜合卷）</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">考試類型</label>
              <select value={examTypeFilter} onChange={(e) => setExamTypeFilter(e.target.value)} className="block w-full border rounded px-3 py-2 text-sm mt-1">
                <option value="ALL">全部</option>
                <option value="GSAT">學測</option>
                <option value="AST">指考</option>
                <option value="AST_NEW">分科</option>
                <option value="MOCK">模考</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">題數</label>
              <div className="flex gap-2 mt-1">
                {COUNT_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setCount(c)} className={`px-3 py-1.5 rounded-lg text-sm border ${count === c ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">作答時間</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MINUTE_OPTIONS.map((m) => (
                  <button key={m} onClick={() => setMinutes(m)} className={`px-3 py-1.5 rounded-lg text-sm border ${minutes === m ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>{m === 0 ? "不計時" : `${m}分`}</button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">範圍：{subjectFilter === "ALL" ? "全科" : subjects.find((s) => s.code === subjectFilter)?.name} · 共 {visibleChapters.length} 個章節納入抽題</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button onClick={startPaper} disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "組卷中…" : `開始作答（${count} 題${minutes > 0 ? ` · ${minutes} 分鐘` : " · 不計時"}）`}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "answering" && current) {
    const opts = parseOptions(current.options);
    const qidKey = String(current.id);
    const picked = choices[qidKey] ?? [];
    return (
      <div className="grid lg:grid-cols-[1fr_220px] gap-4">
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-slate-100 rounded">第 {index + 1} / {questions.length} 題</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{current.chapter.name}</span>
            <span className="px-2 py-1 bg-slate-100 rounded">{current.year}年 {current.examType}</span>
            {deadline > 0 && (
              <span className={`ml-auto px-2 py-1 rounded font-mono ${remaining < 300 ? "bg-red-50 text-red-700" : "bg-slate-100"}`}>
                ⏱ {formatCountdown(remaining)}
              </span>
            )}
          </div>
          <div className="text-[15px] leading-relaxed">
            <LatexRenderer content={current.stem} />
          </div>
          {!isFill ? (
            <div className="space-y-2">
              {opts.map((opt, oi) => {
                const letter = letterOf(opt, String(oi));
                const checked = picked.includes(letter);
                return (
                  <label key={oi} className={`flex gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${checked ? "border-blue-400 bg-blue-50" : ""}`}>
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name={`mock-${current.id}`}
                      checked={checked}
                      onChange={() => toggleChoice(current.id, letter, isMulti)}
                      className="mt-1"
                    />
                    <span className="text-sm flex-1"><LatexRenderer content={opt} /></span>
                  </label>
                );
              })}
            </div>
          ) : (
            <input
              value={fills[qidKey] ?? ""}
              onChange={(e) => setFills((p) => ({ ...p, [qidKey]: e.target.value }))}
              placeholder="請輸入答案"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40">上一題</button>
            {index < questions.length - 1 ? (
              <button onClick={() => setIndex((i) => i + 1)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">下一題</button>
            ) : (
              <button onClick={() => submitPaper(false)} disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50">
                {submitting ? "交卷中…" : `交卷（已答 ${answeredCount()}/${questions.length}）`}
              </button>
            )}
            <button onClick={quitToSetup} className="ml-auto px-3 py-2 text-xs text-slate-400 hover:text-slate-600">放棄</button>
          </div>
        </div>
        <aside className="bg-white border rounded-xl p-4 h-fit lg:sticky lg:top-20">
          <h3 className="text-xs font-semibold text-slate-500 mb-2">題號（{answeredCount()}/{questions.length}）</h3>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-1.5">
            {questions.map((q, qi) => {
              const done = q.questionType === "FILL_IN" ? (fills[String(q.id)] ?? "").trim().length > 0 : (choices[String(q.id)] ?? []).length > 0;
              return (
                <button
                  key={q.id}
                  onClick={() => setIndex(qi)}
                  aria-label={`第 ${qi + 1} 題${done ? "（已答）" : "（未答）"}`}
                  className={`aspect-square rounded-md text-xs font-medium ${qi === index ? "ring-2 ring-blue-500" : ""} ${done ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                >
                  {qi + 1}
                </button>
              );
            })}
          </div>
          <button onClick={() => submitPaper(false)} disabled={submitting} className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50">
            {submitting ? "交卷中…" : "交卷"}
          </button>
        </aside>
      </div>
    );
  }

  if (phase === "result" && report) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl p-6">
          <h1 className="text-xl font-bold">成績：{report.totalScore} / {report.maxScore}</h1>
          <p className="text-sm text-emerald-100 mt-1">答對 {report.correctCount}/{report.total} 題 · 正確率 {report.accuracy}%</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowWrongOnly((v) => !v)} className="px-4 py-1.5 bg-white text-emerald-700 rounded-lg text-sm font-medium">
              {showWrongOnly ? "顯示全部" : `只看錯題（${report.total - report.correctCount}）`}
            </button>
            <button onClick={quitToSetup} className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm">再考一次</button>
          </div>
        </div>
        <div className="space-y-4">
          {reviewItems.map((it, ri) => (
            <div key={it.questionId} className={`bg-white border rounded-xl p-5 space-y-3 ${it.isCorrect ? "border-emerald-200" : "border-red-200"}`}>
              <div className="flex flex-wrap gap-2 text-xs items-center">
                <span className="px-2 py-1 bg-slate-100 rounded">第 {ri + 1} 題</span>
                <span className={`px-2 py-1 rounded ${it.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {it.isCorrect ? "✅ 答對" : "❌ 答錯"} · {it.score} 分
                </span>
              </div>
              <div className="text-[15px] leading-relaxed"><LatexRenderer content={it.stem} /></div>
              <div className="text-sm space-y-1">
                <p>你的答案：<span className="font-medium">{it.userSelected || "（未作答）"}</span></p>
                <p>正確答案：<span className="font-bold text-emerald-700">{it.correctAnswer}</span></p>
              </div>
              <div className="border rounded-lg p-3 bg-slate-50 text-sm leading-relaxed">
                <LatexRenderer content={it.explanation} />
              </div>
            </div>
          ))}
          {reviewItems.length === 0 && <p className="text-center text-slate-400 py-8">全部答對，無錯題 🎉</p>}
        </div>
      </div>
    );
  }

  return <div className="py-12 text-center text-slate-400">載入中…</div>;
}
