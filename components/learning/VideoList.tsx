"use client";
import { useState } from "react";
import { formatViewCount } from "@/lib/utils";
import VideoPlayerModal from "./VideoPlayerModal";

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
              <img src={v.thumbnailUrl} alt={v.title} className="w-full aspect-video object-cover" />
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
