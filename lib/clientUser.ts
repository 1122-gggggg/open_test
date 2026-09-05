import { safeLocalStorage } from "./storage";
import { USER_KEY_HEADER, USER_KEY_STORAGE, sanitizeUserKey } from "./user";

// 取得或初始化當前瀏覽器的 userKey（持久於 localStorage）
export function getOrCreateClientUserKey(): string {
  const existing = safeLocalStorage.getItem(USER_KEY_STORAGE);
  if (existing) {
    const clean = sanitizeUserKey(existing);
    if (clean !== "legacy") return clean;
  }
  // 生成簡單隨機 ID：u_時間戳_隨機字串（純英數，相容 regex）
  const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  safeLocalStorage.setItem(USER_KEY_STORAGE, id);
  return id;
}

// 帶入 x-user-key 標頭的 fetch 封裝
export async function userFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const userKey = getOrCreateClientUserKey();
  const headers = new Headers(init.headers);
  if (!headers.has(USER_KEY_HEADER)) {
    headers.set(USER_KEY_HEADER, userKey);
  }
  return fetch(input, { ...init, headers });
}
