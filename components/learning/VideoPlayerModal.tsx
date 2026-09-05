"use client";
export default function VideoPlayerModal({ youtubeId, title, onClose }: { youtubeId: string; title: string; onClose: () => void }) {
  // YouTube ID 為 base64url（含 - 與 _），僅去空白，不可再截斷
  const cleanId = youtubeId.trim();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 px-2">✕</button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${cleanId}?autoplay=1`}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
