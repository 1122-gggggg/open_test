import { NextRequest } from "next/server";

// 簡易記憶體限流：每個 IP 60 秒內最多 20 次請求
// 使用 Map<ip, {count, reset}> 記錄，reset 為視窗到期時間（毫秒時間戳）

const WINDOW_MS = 60 * 1000; // 60 秒視窗
const MAX_REQUESTS = 20; // 每視窗最多 20 次

// 計數器儲存：key 為 IP，value 為 { count: 已請求次數, reset: 視窗重置時間 }
const store = new Map<string, { count: number; reset: number }>();

/**
 * 取得客戶端 IP
 * 優先讀取 x-forwarded-for（反向代理常見標頭），取第一個 IP
 * 若無則回 127.0.0.1（本地開發/測試預設）
 */
export function getClientIp(req: NextRequest | Request): string {
  // 以具名 const 承接轉型，避免 inline (req as X).headers 的未檢查存取
  const reqLike = req as unknown as { headers?: unknown; ip?: string };
  const headersRaw = reqLike.headers;
  // 標準 Headers 物件（含 NextRequest）
  if (headersRaw && typeof (headersRaw as Headers).get === "function") {
    const h = headersRaw as Headers;
    const forwarded = h.get("x-forwarded-for");
    if (forwarded && forwarded.trim().length > 0) {
      return forwarded.split(",")[0].trim() || "127.0.0.1";
    }
    const realIp = h.get("x-real-ip");
    if (realIp && realIp.trim().length > 0) {
      return realIp.trim();
    }
  } else if (headersRaw && typeof headersRaw === "object") {
    // 相容物件形式 headers（測試或自訂 Request）
    const objHeaders = headersRaw as Record<string, string>;
    const f = objHeaders["x-forwarded-for"] ?? objHeaders["X-Forwarded-For"];
    if (typeof f === "string" && f.length > 0) {
      return f.split(",")[0].trim() || "127.0.0.1";
    }
    const real = objHeaders["x-real-ip"] ?? objHeaders["X-Real-Ip"];
    if (typeof real === "string" && real.length > 0) {
      return real.trim();
    }
  }
  const maybeIp = reqLike.ip;
  if (typeof maybeIp === "string" && maybeIp.length > 0) {
    return maybeIp;
  }
  return "127.0.0.1";
}

/**
 * 檢查並更新限流計數
 * @param ip 客戶端 IP
 * @returns true 表示通過（未超限），false 表示已超限應回 429
 */
export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  // 無紀錄或視窗已過期 -> 重置
  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }

  // 已達上限 -> 阻擋
  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  // 未達上限 -> 計數加一並放行
  entry.count += 1;
  // 清理過期項目，避免記憶體膨脹（懶清理：順帶刪除已過期的其他 IP）
  if (store.size > 1000) {
    for (const [k, v] of store.entries()) {
      if (now > v.reset) store.delete(k);
    }
  }
  return true;
}

/**
 * 別名：回傳物件形式，供需要詳細資訊的呼叫端使用
 */
export function checkRateLimit(ip: string): { success: boolean; remaining: number; reset: number } {
  const allowed = rateLimit(ip);
  const entry = store.get(ip);
  const remaining = entry ? Math.max(0, MAX_REQUESTS - entry.count) : MAX_REQUESTS;
  const reset = entry ? entry.reset : Date.now() + WINDOW_MS;
  return { success: allowed, remaining, reset };
}

// 僅供測試/維護使用：重置特定 IP 或全部
export function resetRateLimit(ip?: string): void {
  if (ip) store.delete(ip);
  else store.clear();
}

// 供測試檢查內部狀態（不建議正式環境使用）
export function _getStore(): Map<string, { count: number; reset: number }> {
  return store;
}
