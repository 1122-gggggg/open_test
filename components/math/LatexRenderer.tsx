"use client";
import katex from "katex";
import { useMemo } from "react";

function renderLatexSafe(text: string): string {
  // Replace $$...$$ and $...$ with katex HTML, fallback to text on error
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
