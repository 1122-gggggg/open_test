import "./globals.css";
import "katex/dist/katex.min.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "高中全科學習平台 | 108課綱",
  description: "台灣高中生 108課綱全科學習、題庫與弱點排程系統",
};

const nav = [
  { href: "/", label: "首頁" },
  { href: "/learning", label: "學習區" },
  { href: "/exam", label: "題庫區" },
  { href: "/analytics", label: "弱點分析" },
  { href: "/planner", label: "學習排程" },
  { href: "/admin/submissions", label: "審核後台" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-blue-600">📚 高中全科學習平台</Link>
            <nav className="flex gap-1 sm:gap-2">
              {nav.map(n => (
                <Link key={n.href} href={n.href} className="px-2 sm:px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 text-slate-700 transition">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
        <footer className="border-t py-4 text-center text-xs text-slate-400">108課綱 · 學測/分科/模考題庫 · 間隔重複學習系統</footer>
      </body>
    </html>
  );
}
