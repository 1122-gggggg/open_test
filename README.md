# 高中全科學習平台（108課綱）

## 快速開始
```bash
npm ci
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
npm run dev
# http://localhost:3000
```

## 功能特色
- 📖 **108課綱章節樹**：語文、數A/數B、自然四科、社會三科，高一至高三必選修。
- 🎥 **精選 YouTube 教學影片**：依章節觀看數排序，內嵌播放，1 小時上限快取防止超出 API 配額。
- 📝 **歷年大考題庫與搜尋**：100~114 年學測/指考/分科/模考，支援 LaTeX 數學式渲染、安全關鍵字模糊搜尋、keyset 分頁與題目收藏。
- ⏱️ **線上模擬考模式**（`/mock`）：自由挑選科目、題數（10~50）與考試時間（20~90 分鐘或不計時），隨機組卷、倒數計時、題號盤、作答草稿自動暫存續考、交卷即產成績單與逐題詳解。
- 📊 **個人弱點分析**（`/analytics`）：雷達圖掌握度、Top5 弱點章節與錯題本，支援多使用者隔離（免登入瀏覽器識別）。
- 🎯 **艾賓浩斯間隔重複排程**（`/planner`）：錯題或章節正確率 <70% 自動排程 D+1/D+3/D+7/D+14 複習任務，真實連續打卡天數追蹤。
- 💡 **詳解群眾協作與審核**（`/admin/submissions`）：社群投稿更佳詳解，管理員 Token 審核採納自動替換題目詳解。

## 題庫擴充
- 標準 JSON 批次匯入：`npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import_exam_data.ts data.json`
- 生成題庫 100-114 已在 `prisma/seeds/generated/*.json`，全量匯入：`npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import_all_generated.ts`

## 環境變數
見 `.env.example`：ADMIN_TOKEN（審核後台）、YOUTUBE_API_KEY（選填，無則 fallback 精選庫）、DATABASE_URL

## 測試與驗證
```bash
npm test               # 執行 vitest 全套測試（評分、排程、弱點、連續打卡、模擬考純函式）
npx tsc --noEmit       # TypeScript 靜態型別檢查
npm run build          # Next.js 正式建置
```

## 部署
- SQLite 開發：`prisma/dev.db`，生產建議 Postgres：改 `prisma/schema.prisma` datasource 為 postgresql 並設 DATABASE_URL，執行 `npx prisma migrate deploy`
- Docker：`docker build -t hslp . && docker run -p 3000:3000 --env-file .env hslp`
