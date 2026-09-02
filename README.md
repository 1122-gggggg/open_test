# 高中全科學習平台（108課綱）

## 快速開始
```bash
npm ci
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
npm run dev
# http://localhost:3000
```

## 題庫擴充
- 標準 JSON 批次匯入：`npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import_exam_data.ts data.json`
- 生成題庫 100-114 已在 `prisma/seeds/generated/*.json`，全量匯入：`npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import_all_generated.ts`

## 環境變數
見 `.env.example`：ADMIN_TOKEN（審核後台）、YOUTUBE_API_KEY（選填，無則 fallback 精選庫）、DATABASE_URL

## 部署
- SQLite 開發：`prisma/dev.db`，生產建議 Postgres：改 `prisma/schema.prisma` datasource 為 postgresql 並設 DATABASE_URL，執行 `npx prisma migrate deploy`
- Docker：`docker build -t hslp . && docker run -p 3000:3000 --env-file .env hslp`
