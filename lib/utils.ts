export function formatViewCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "萬次";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "千次";
  return n.toLocaleString() + "次";
}
export function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }
