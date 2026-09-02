"use client";
import katex from "katex";
import { useMemo } from "react";

// LRU 快取：共用於 LatexRenderer 與 LatexBlock，避免重複 KaTeX 解析開銷
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

function renderLatexSafe(text: string): string {
  // XSS 消毒：檢測可疑腳本標籤或事件處理器，命中則直接回純文字（逸脫 HTML）不經 KaTeX 渲染
  if (/<script|on\w+\s*=/i.test(text)) {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    // 同步寫入快取，避免重複檢測與逸脫開銷
    cache.set(text, escaped);
    if (cache.size > MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    return escaped;
  }
  const cached = cache.get(text);
  if (cached !== undefined) {
    // LRU：命中時移至 Map 尾端，保持最近使用
    cache.delete(text);
    cache.set(text, cached);
    return cached;
  }
  let html = text;
  // block $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }); }
    catch { return `<span class="text-red-500">${expr}</span>`; }
  });
  // inline $...$  (avoid $$ already handled)
  html = html.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }); }
    catch { return `<span>${expr}</span>`; }
  });
  // 寫入快取並執行 LRU 淘汰（刪除最舊的一筆）
  cache.set(text, html);
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  return html;
}

export default function LatexRenderer({ content, className }: { content: string; className?: string }) {
  const html = useMemo(()=> renderLatexSafe(content), [content]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function LatexBlock({ content }: { content: string }) {
  const html = useMemo(()=> renderLatexSafe(content), [content]);
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
