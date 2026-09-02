"use client";
import { useState } from "react";

type Chapter = { id:number; name:string; code:string; grade:number; semester:number; sortOrder:number; description?:string|null };
type Subject = { id:number; name:string; code:string; category:string; icon:string; chapters: Chapter[] };

export default function CurriculumSidebar({ subjects, selectedChapterId, onSelect }: {
  subjects: Subject[];
  selectedChapterId: number | null;
  onSelect: (id:number)=>void;
}) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ "語文": true, "數學": true, "自然": true, "社會": true });
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

  const categories = Array.from(new Set(subjects.map(s=> s.category)));

  return (
    <div className="bg-white border rounded-xl p-3 space-y-2" role="navigation" aria-label="課程章節導航">
      <h3 className="font-bold text-sm px-1" id="curriculum-heading">108 課綱章節</h3>
      {categories.map(cat => (
        <div key={cat} className="border rounded-lg overflow-hidden">
          <button
            onClick={()=> setOpenCats(o=> ({...o, [cat]: !o[cat]}))}
            onKeyDown={(e)=> { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); setOpenCats(o=> ({...o, [cat]: !o[cat]})); } }}
            className="w-full flex justify-between items-center px-3 py-2 bg-slate-50 text-sm font-medium"
            aria-label={`${cat}分類，點擊展開或收合`}
            aria-expanded={!!openCats[cat]}
            aria-controls={`cat-${cat}`}
            role="button"
            tabIndex={0}
          >
            <span>{cat}</span><span className="text-xs text-slate-400" aria-hidden="true">{openCats[cat] ? "−" : "+"}</span>
          </button>
          {openCats[cat] && (
            <div id={`cat-${cat}`} className="divide-y" role="group" aria-label={`${cat}科目列表`}>
              {subjects.filter(s=> s.category===cat).map(sub => {
                const isOpen = openSubjects[sub.code] ?? true;
                return (
                  <div key={sub.id}>
                    <button
                      onClick={()=> setOpenSubjects(o=> ({...o, [sub.code]: !isOpen}))}
                      onKeyDown={(e)=> { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); setOpenSubjects(o=> ({...o, [sub.code]: !isOpen})); } }}
                      className="w-full flex justify-between items-center px-3 py-2 text-sm hover:bg-slate-50"
                      aria-label={`${sub.name}科目，含${sub.chapters.length}個章節，點擊展開或收合`}
                      aria-expanded={isOpen}
                      aria-controls={`subject-${sub.code}`}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="flex items-center gap-2"><span aria-hidden="true">{sub.icon}</span>{sub.name}</span>
                      <span className="text-xs text-slate-400" aria-hidden="true">{sub.chapters.length} 章</span>
                    </button>
                    {isOpen && (
                      <div id={`subject-${sub.code}`} className="pl-2 pb-2 space-y-1" role="group" aria-label={`${sub.name}章節列表`}>
                        {[10,11,12].map(grade => {
                          const chs = sub.chapters.filter(c=> c.grade===grade);
                          if (chs.length===0) return null;
                          return (
                            <div key={grade} className="px-2" role="group" aria-label={`高${grade-9} ${grade===10?"必修":grade===11?"選修":"總複習"}`}>
                              <div className="text-xs text-slate-400 mt-1">高{grade-9} {grade===10?"必修":grade===11?"選修": "總複習"}</div>
                              {chs.sort((a,b)=> a.sortOrder - b.sortOrder).map(ch=> (
                                <button
                                  key={ch.id}
                                  onClick={()=> onSelect(ch.id)}
                                  onKeyDown={(e)=> { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); onSelect(ch.id); } }}
                                  className={`w-full text-left text-xs px-2 py-1.5 rounded-md mt-1 ${selectedChapterId===ch.id ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                                  aria-label={`選擇章節：${ch.name}`}
                                  aria-current={selectedChapterId===ch.id ? "true" : undefined}
                                  aria-selected={selectedChapterId===ch.id}
                                  role="button"
                                  tabIndex={0}
                                >
                                  {ch.name}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
