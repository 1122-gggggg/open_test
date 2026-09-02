/**
 * 示範爬蟲骨架：抓取公開考古題來源之解析器
 * 封裝題幹、選項、大考中心公布答案之擷取規範
 * 注意：僅為骨架示範，需依實際來源 HTML 結構調整 selector
 */
import fs from "fs";

type CrawledQuestion = {
  examType:string; year:number; questionNumber:number;
  stem:string; options:string[]; answer:string; explanationSource:string;
};

// 示範：從大考中心公開頁面解析（需自行補上實際 URL 與 selector）
export async function crawlCeecList(indexUrl:string): Promise<string[]> {
  console.log(`[crawl] fetching index ${indexUrl}`);
  const res = await fetch(indexUrl);
  const html = await res.text();
  // TODO: 解析列表頁，萃取每題詳情頁 URL
  // 範例：const links = [...html.matchAll(/href="(\/exam\/[^"]+)"/g)].map(m=> m[1]);
  const links: string[] = [];
  console.log(`[crawl] found ${links.length} links (demo placeholder)`);
  return links;
}

export async function crawlQuestionDetail(url:string): Promise<CrawledQuestion | null> {
  console.log(`[crawl] detail ${url}`);
  const res = await fetch(url);
  const html = await res.text();
  // TODO: 依實際 HTML 結構解析
  // 範例 selectors:
  // const stem = html.match(/<div class="stem">([\s\S]*?)<\/div>/)?.[1] || "";
  // const options = [...html.matchAll(/<li class="option">([\s\S]*?)<\/li>/g)].map(m=> m[1].trim());
  // const answer = html.match(/<span class="answer">([^<]+)<\/span>/)?.[1] || "";
  return null;
}

export async function crawlAndSave(indexUrl:string, outPath:string, meta:{ subjectCode:string, chapterCode:string, examType:string, year:number }){
  const links = await crawlCeecList(indexUrl);
  const results: any[] = [];
  for (const link of links) {
    const q = await crawlQuestionDetail(link);
    if (q) results.push({ ...q, subjectCode: meta.subjectCode, chapterCode: meta.chapterCode });
    await new Promise(r=> setTimeout(r, 800)); // 禮貌延遲
  }
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`[crawl] saved ${results.length} questions to ${outPath}`);
}

// CLI
const url = process.argv[2];
const out = process.argv[3] || "crawled_questions.json";
if (url) {
  crawlAndSave(url, out, { subjectCode:"MATH", chapterCode:"MA11-2", examType:"GSAT", year:114 }).catch(console.error);
} else {
  console.log("Usage: ts-node scripts/crawl_ceec_questions.ts <indexUrl> [out.json]");
  console.log("This is a skeleton — customize selectors for CEEC site structure.");
}

export const SPEC = {
  fields: ["stem","options","answer","explanationSource"],
  note: "需遵守來源網站 robots.txt 與使用條款，僅抓取公開試題",
};
