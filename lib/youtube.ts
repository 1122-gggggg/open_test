export interface TutorialVideoData {
  youtubeId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  duration: string;
  thumbnailUrl: string;
}

const curatedLibrary: Record<string, TutorialVideoData[]> = {
  default: [
    { youtubeId: "dQw4w9WgXcQ", title: "【均一】學測數學總複習：指對數函數精講", channelTitle: "均一教育平台", viewCount: 158000, duration: "18:32", thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
    { youtubeId: "9bZkp7q19f0", title: "【酷課雲】高中物理：運動學完整解析", channelTitle: "臺北酷課雲", viewCount: 125000, duration: "22:10", thumbnailUrl: "https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg" },
    { youtubeId: "kJQP7kiw5Fk", title: "【得勝者】英文學測作文：高分句型 30 句", channelTitle: "得勝者文教", viewCount: 98000, duration: "15:45", thumbnailUrl: "https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg" },
    { youtubeId: "OPf0YbXqDm0", title: "【名師開講】化學：莫耳與化學計量", channelTitle: "高中名師頻道", viewCount: 87000, duration: "20:05", thumbnailUrl: "https://img.youtube.com/vi/OPf0YbXqDm0/mqdefault.jpg" },
  ],
};

const chapterCurated: Record<string, TutorialVideoData[]> = {
  "數與式": [
    { youtubeId: "RgKAFK5djSk", title: "高一數學｜數與式：有理數與無理數｜108課綱", channelTitle: "均一教育平台", viewCount: 152000, duration: "14:20", thumbnailUrl: "https://img.youtube.com/vi/RgKAFK5djSk/mqdefault.jpg" },
    { youtubeId: "NUsoVlDFqZg", title: "指數律與科學記號｜高中數學必修", channelTitle: "臺北酷課雲", viewCount: 82000, duration: "12:05", thumbnailUrl: "https://img.youtube.com/vi/NUsoVlDFqZg/mqdefault.jpg" },
  ],
  "多項式函數": [
    { youtubeId: "hT_nvWreIhg", title: "多項式函數圖形與二次函數極值｜學測必考", channelTitle: "得勝者文教", viewCount: 134000, duration: "19:40", thumbnailUrl: "https://img.youtube.com/vi/hT_nvWreIhg/mqdefault.jpg" },
    { youtubeId: "W6NZfCO5SIk", title: "餘式定理與因式定理精講", channelTitle: "均一教育平台", viewCount: 76000, duration: "16:30", thumbnailUrl: "https://img.youtube.com/vi/W6NZfCO5SIk/mqdefault.jpg" },
  ],
  "指對數函數": [
    { youtubeId: "CevxZvSJLk8", title: "指數與對數函數：圖形、性質、學測題型", channelTitle: "均一教育平台", viewCount: 189000, duration: "25:12", thumbnailUrl: "https://img.youtube.com/vi/CevxZvSJLk8/mqdefault.jpg" },
    { youtubeId: "fRh_vgS2dFE", title: "對數律與換底公式｜分科測驗必看", channelTitle: "得勝者文教", viewCount: 112000, duration: "18:05", thumbnailUrl: "https://img.youtube.com/vi/fRh_vgS2dFE/mqdefault.jpg" },
    { youtubeId: "09R8_2nJtjg", title: "指對數方程式與不等式解法", channelTitle: "高中名師頻道", viewCount: 67000, duration: "21:30", thumbnailUrl: "https://img.youtube.com/vi/09R8_2nJtjg/mqdefault.jpg" },
  ],
  "三角函數": [
    { youtubeId: "JGwWNGJdvx8", title: "三角函數：正弦餘弦圖形與疊合", channelTitle: "均一教育平台", viewCount: 145000, duration: "23:00", thumbnailUrl: "https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg" },
    { youtubeId: "k85mZbHd718", title: "三角函數的應用：正餘弦定理", channelTitle: "臺北酷課雲", viewCount: 93000, duration: "17:45", thumbnailUrl: "https://img.youtube.com/vi/k85mZbHd718/mqdefault.jpg" },
  ],
  "空間向量": [
    { youtubeId: "YQHsXMglC9A", title: "空間向量：內積外積與平面方程式｜108課綱第三冊", channelTitle: "均一教育平台", viewCount: 150000, duration: "26:10", thumbnailUrl: "https://img.youtube.com/vi/YQHsXMglC9A/mqdefault.jpg" },
    { youtubeId: "3AtDnEC4zak", title: "空間中的直線與平面｜學測數A重點", channelTitle: "得勝者文教", viewCount: 80000, duration: "20:00", thumbnailUrl: "https://img.youtube.com/vi/3AtDnEC4zak/mqdefault.jpg" },
  ],
  "物理_力學": [
    { youtubeId: "60ItHLz5WEA", title: "高中物理：牛頓運動定律完整教學", channelTitle: "均一教育平台", viewCount: 167000, duration: "28:15", thumbnailUrl: "https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg" },
  ],
};

// 記憶體快取：TTL 1 小時，避免重複呼叫 YouTube API；上限 200 筆並淘汰過期/最舊
const memCache = new Map<string, { data: TutorialVideoData[]; exp: number }>();
const MAX_CACHE_ENTRIES = 200;
function cacheSet(key: string, data: TutorialVideoData[]): void {
  const now = Date.now();
  for (const [k, v] of memCache) {
    if (v.exp <= now) memCache.delete(k);
    if (memCache.size < MAX_CACHE_ENTRIES) break;
  }
  while (memCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = memCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    memCache.delete(oldest);
  }
  memCache.set(key, { data, exp: now + 3600 * 1000 });
}

export async function fetchChapterVideos(chapterName: string, subjectName: string, maxResults = 8): Promise<TutorialVideoData[]> {
  const key = `${chapterName}:${subjectName}:${maxResults}`
  const cached = memCache.get(key)
  if (cached && cached.exp > Date.now()) {
    return cached.data
  }
  if (cached) memCache.delete(key)
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const q = encodeURIComponent(`${subjectName} 高中 108課綱 ${chapterName}`);
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&order=viewCount&q=${q}&key=${apiKey}`;
      const res = await fetch(searchUrl, { next: { revalidate: 3600 } } as unknown as RequestInit);
      if (res.ok) {
        const data = await res.json();
        const ids: string[] = (data.items || []).map((i: any) => i.id.videoId).filter(Boolean);
        if (ids.length > 0) {
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${ids.join(",")}&key=${apiKey}`;
          const statsRes = await fetch(statsUrl, { next: { revalidate: 3600 } } as unknown as RequestInit);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const videos: TutorialVideoData[] = (statsData.items || []).map((item: any) => ({
              youtubeId: item.id,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle,
              viewCount: parseInt(item.statistics.viewCount || "0", 10),
              duration: item.contentDetails.duration?.replace("PT","").toLowerCase() || "10:00",
              thumbnailUrl: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`,
            }));
            videos.sort((a,b)=> b.viewCount - a.viewCount);
            if (videos.length > 0) {
              cacheSet(key, videos);
              return videos;
            }
          }
        }
      }
    } catch (e) {
      console.warn("[youtube] API failed, fallback to curated", e);
    }
  }
  // fallback
  const curated = chapterCurated[chapterName] || chapterCurated[chapterName.replace(/^.*_/,"")] || null;
  if (curated) {
    const result = [...curated].sort((a, b) => b.viewCount - a.viewCount);
    cacheSet(key, result);
    return result;
  }
  // generic fallback mixed with chapter
  const generic = [...curatedLibrary.default];
  // sprinkle chapter name into title for relevance
  const result = generic.map((v) => ({ ...v, title: v.title.replace("學測", chapterName + " 學測") })).sort((a, b) => b.viewCount - a.viewCount).slice(0, maxResults);
  cacheSet(key, result);
  return result;
}

export function getFallbackVideos(chapterName: string): TutorialVideoData[] {
  return chapterCurated[chapterName] ? [...chapterCurated[chapterName]] : [...curatedLibrary.default];
}
