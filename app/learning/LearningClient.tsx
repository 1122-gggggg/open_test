"use client";
import { useState } from "react";
import CurriculumSidebar from "@/components/learning/CurriculumSidebar";
import VideoList from "@/components/learning/VideoList";

export default function LearningClient({ subjects, videosByChapter }: any) {
  const firstChapterId = subjects[0]?.chapters[0]?.id ?? null;
  const [selected, setSelected] = useState<number | null>(firstChapterId);

  const selectedChapter = subjects.flatMap((s:any)=> s.chapters).find((c:any)=> c.id===selected);
  const videos = selected ? (videosByChapter[selected] || []) : [];
  const chapterName = selectedChapter?.name || "請選擇章節";

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <CurriculumSidebar subjects={subjects} selectedChapterId={selected} onSelect={setSelected} />
      <div className="bg-white border rounded-xl p-5">
        <VideoList videos={videos} chapterName={chapterName} />
      </div>
    </div>
  );
}
