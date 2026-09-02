"use client";
/* eslint-disable @next/next/no-img-element -- 保留 <img> 以避免 next/image 需額外遠端域名配置；已加 lazy/async 與寬高占位 */
import { useState } from "react";
import { formatViewCount } from "@/lib/utils";
import VideoPlayerModal from "./VideoPlayerModal";

// 確保縮圖使用 https，避免 mixed-content 並符合快取策略
function ensureHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) return url.replace(/^http:\/\//, "https://");
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}
type Video = { id:number; title:string; youtubeId:string; channelTitle:string; viewCount:number; duration:string; thumbnailUrl:string };

export default function VideoList({ videos, chapterName }: { videos: Video[]; chapterName: string }) {
  const [playing, setPlaying] = useState<Video | null>(null);
  const sorted = [...videos].sort((a,b)=> b.viewCount - a.viewCount);

  if (videos.length===0) return <div className="text-sm text-slate-500 py-8 text-center">此章節尚無影片</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold">{chapterName} <span className="text-sm font-normal text-slate-500">— 依觀看數排序</span></h2>
        <span className="text-xs text-slate-400">{sorted.length} 部影片</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(v=> (
          <div key={v.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer" onClick={()=> setPlaying(v)}>
            <div className="relative">
              <img
                src={ensureHttps(v.thumbnailUrl)}
                alt={v.title}
                loading="lazy"
                decoding="async"
                width={320}
                height={180}
                className="w-full aspect-video object-cover bg-slate-100"
              />
              <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">{v.duration}</span>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium line-clamp-2 leading-snug">{v.title}</h3>
              <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                <span>{v.channelTitle}</span>
                <span className="font-medium text-slate-700">{formatViewCount(v.viewCount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {playing && <VideoPlayerModal youtubeId={playing.youtubeId} title={playing.title} onClose={()=> setPlaying(null)} />}
    </>
  );
}
