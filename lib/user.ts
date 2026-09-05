// 使用者識別輔助函式：自請求讀取或由前端持久化
// 允許字母/數字/底線/減號，長度 4~64 字元；非法或缺失時 fallback 為 "legacy"
export const USER_KEY_HEADER = "x-user-key";
export const USER_KEY_STORAGE = "hslp-user-key";

export function sanitizeUserKey(raw: unknown): string {
  if (typeof raw !== "string") return "legacy";
  const trimmed = raw.trim();
  if (/^[a-zA-Z0-9_-]{4,64}$/.test(trimmed)) return trimmed;
  return "legacy";
}

export function getUserKeyFromHeaders(headers: Headers): string {
  return sanitizeUserKey(headers.get(USER_KEY_HEADER));
}
