// 提供安全的 localStorage 封裝，避免 SSR 與隱私模式拋錯
export const safeLocalStorage = {
  // 讀取字串，未就緒或異常回傳 null
  getItem(key: string): string | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  // 寫入字串，異常靜默忽略
  setItem(key: string, value: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch {
      // 隱私模式或配額滿時忽略
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch {}
  },
  // 讀取 JSON，失敗回 fallback
  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = safeLocalStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  // 寫入 JSON
  setJSON(key: string, value: unknown): void {
    try {
      safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export default safeLocalStorage;
