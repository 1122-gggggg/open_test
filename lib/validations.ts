import { z } from "zod";

// 作答提交驗證：userSelected 為字串，timeSpent 為 0~3600 秒
export const submitSchema = z.object({
  userSelected: z.string(),
  timeSpent: z.number().min(0).max(3600),
});

// 詳解投稿驗證
export const submissionSchema = z.object({
  questionId: z.number().int().positive(),
  contributorName: z.string().min(1).max(20),
  proposedExplanation: z.string().min(10).max(5000),
  reason: z.string().min(5).max(500),
});

// 管理員審核動作驗證
export const adminActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reviewerComment: z.string().optional(),
});

// 排程完成打卡驗證
export const scheduleCompleteSchema = z.object({
  id: z.number().int().positive(),
});

// 模擬考組卷筆數驗證：1~100
export const mockPaperSchema = z.object({
  count: z.number().int().min(1).max(100),
});

// 模擬考交卷驗證：answers 為 {questionId: userSelected}，至少 1 題至多 100 題
export const mockSubmitSchema = z.object({
  answers: z.record(z.string(), z.string()).refine((r) => Object.keys(r).length >= 1 && Object.keys(r).length <= 100, {
    message: "answers 需為 1~100 題",
  }),
  timeSpent: z.number().min(0).max(3600 * 5).optional(),
});
