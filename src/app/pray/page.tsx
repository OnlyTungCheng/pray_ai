"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnonymousSignIn } from '@/features/auth/anonymous-captcha-gate';
import { showApiErrorToast } from '@/lib/api-error-toast';
// import { HALLS } from '@/features/temple-room/constants'; // No longer selecting Hall here

export default function PrayPage() {
  const router = useRouter();
  const { signIn, captchaWidget } = useAnonymousSignIn();
  
  const [projectName, setProjectName] = useState('');
  const [eventType, setEventType] = useState<'build' | 'deploy' | 'migration' | 'release'>('deploy');
  const [prayer, setPrayer] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useState(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Lập Đền Cầu Nguyện | Đền Cầu Nguyện';
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await signIn();

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          eventType,
          prayer,
          title: title.trim() ? title : undefined,
          description: description.trim() ? description : undefined,
        }),
      });

      if (!res.ok) {
        const data = await showApiErrorToast(res, 'Không thể tạo phòng.');
        throw new Error(data.error || 'Failed to create room');
      }

      const { room } = await res.json();
      router.push(`/temple/${room.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi tạo phòng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#1c1917] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-[#181615] to-black text-stone-100 flex flex-col justify-center items-center p-4">
      {captchaWidget}
      
      <div className="w-full max-w-lg bg-stone-900/90 border-2 border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-500/20">
            ⛩️ Đàn Lễ ⛩️
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-serif text-amber-200">
            TẠO PHÒNG CẦU NGUYỆN
          </h1>
          <p className="text-stone-400 text-xs md:text-sm mt-1">
            Lập đàn cầu nguyện nhanh trước giờ Deploy, Build hoặc Migration!
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs md:text-sm font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 font-bold px-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
              👤 Tên dự án (Project Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Notex, Uncle Ming Clone..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm font-medium transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
              ⚡ Loại sự kiện (Event Type)
            </label>
            <select
              value={eventType}
              onChange={(e: any) => setEventType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-400 text-sm font-medium transition-colors"
            >
              <option value="deploy">🚀 Deploy Production</option>
              <option value="build">📦 Build & Bundle</option>
              <option value="migration">💾 Database Migration</option>
              <option value="release">🎉 Release Version</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
              🙏 Lời khấn chính (Prayer Wish) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Cầu cho pipeline xanh mướt, deploy 0 downtime, không phát sinh lỗi authentication..."
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm leading-relaxed transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
                Tiêu đề phòng (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: Lễ Deploy v2.4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
                Mô tả (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: Cầu tổ nghiệp phù hộ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-base shadow-xl hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>✨</span>
            <span>{isSubmitting ? 'ĐANG TẠO PHÒNG...' : 'TẠO PHÒNG NGAY'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
