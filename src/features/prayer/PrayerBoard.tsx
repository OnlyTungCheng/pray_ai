import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import type { Wish } from '../../types';

const QUICK_TAGS = [
  '🚀 Deploy 0 Bug',
  '💼 Client Demo Chốt Ngay',
  '⚡ Unit Test Pass 100%',
  '🛡️ No Production Crash',
  '☕ Code Chạy 1st Try',
  '🧹 Clean Code Refactor'
];

interface PrayerBoardProps {
  onAddWish: (wish: Wish) => void;
  wishes?: Wish[];
  currentDeityName: string;
  hasActiveIncense: boolean;
}

export default function PrayerBoard({ onAddWish, wishes = [], currentDeityName, hasActiveIncense }: PrayerBoardProps) {
  const [wishText, setWishText] = useState('');
  const [devName, setDevName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const inputSectionRef = useRef<HTMLElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Rule: Must have active burning incense in the censer before praying!
    if (!hasActiveIncense) {
      setErrorMessage('⚠️ BẠN CẦN THẮP HƯƠNG TRƯỚC KHI CẦU NGUYỆN! Hãy bấm nút 「福」 hai bên để lấy hương và thả vào bát hương.');
      return;
    }

    if (!wishText.trim()) {
      setErrorMessage('⚠️ Vui lòng nhập nội dung lời cầu nguyện của bạn!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onAddWish({
        id: Date.now(),
        author: devName.trim() || 'Anonymous Dev',
        text: wishText.trim(),
        targetDeity: currentDeityName || 'Claude Code',
        blessings: 1,
        time: 'Just now'
      });

      setWishText('');
      setIsSubmitting(false);
      setSuccessMessage('🎉 Lời cầu nguyện của bạn đã dâng thành công! Các Vị Thần Dev đã chứng giám. Chúc bạn Deploy 0 Bug & Demo thuận lợi! 🙏✨');
    }, 400);
  };

  const handleSelectTag = (tag: string) => {
    setWishText((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  return (
    <section id="prayer-input-section" ref={inputSectionRef} className="max-w-4xl mx-auto px-4 py-8 z-30 relative scroll-mt-20">
      {/* Eye-catching Banner Header */}
      <div className="p-1 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-8">
        <div className="bg-stone-950 p-6 rounded-[14px] text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-500/40 animate-pulse">
            ✨ KHU VỰC DÂNG LỜI CẦU NGUYỆN DEV ✨
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-amber-200 font-serif mb-2">
            ✍️ KHUNG NHẬP LỜI CẦU NGUYỆN
          </h2>
          <p className="text-stone-300 text-sm max-w-xl mx-auto">
            Nhập tâm nguyện của bạn bên dưới để dâng lên <strong className="text-amber-400">{currentDeityName}</strong> trước khi Deploy hoặc Demo!
          </p>
        </div>
      </div>

      {/* Warning Alert when no incense in censer */}
      {!hasActiveIncense && (
        <div className="p-4 rounded-xl bg-amber-950/90 border-2 border-amber-400 text-amber-200 text-sm font-bold flex items-center justify-between gap-3 mb-6 shadow-2xl animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <span>Bát hương hiện chưa có nhang! Vui lòng bấm nút <strong className="text-amber-300 underline">「福」</strong> ở hai bên để rút hương và thả vào bát hương trước khi gửi lời cầu nguyện.</span>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/90 border-2 border-red-500 text-red-100 text-sm font-bold flex items-center justify-between mb-6 shadow-xl">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-300 font-extrabold hover:text-white px-2 text-lg">×</button>
        </div>
      )}

      {/* Success Notification Popup Toast */}
      {successMessage && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-base shadow-2xl flex items-center justify-between mb-6 animate-bounce border-2 border-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="px-4 py-2 bg-stone-950 text-amber-300 hover:bg-stone-900 rounded-xl text-xs font-bold cursor-pointer shadow"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Prayer Input Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-stone-900/95 border-2 border-amber-500/50 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] mb-12">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
                👤 Tên / Legend Dev (Optional)
              </label>
              <input
                type="text"
                placeholder="VD: Tung Senior Fullstack, Lead Dev..."
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm font-medium transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
                ⛩️ Dâng Lời Cầu Nguyện Tới
              </label>

              <div className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>Thần {currentDeityName}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
              💬 Nội Dung Lời Cầu Nguyện (Developer Wish) <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Nhập lời khấn: Cầu cho buổi Deploy Production chiều nay 0 bug, 0 downtime, client demo xong gật đầu khen ngợi chốt hợp đồng ngay..."
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-950 border-2 border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 text-base leading-relaxed transition-colors resize-none shadow-inner"
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <span className="block text-xs font-semibold text-stone-400 mb-2">💡 Gợi ý mẫu khấn nhanh:</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-900/60 text-stone-200 hover:text-amber-200 text-xs border border-stone-700 hover:border-amber-500/50 transition-all cursor-pointer font-medium"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold flex items-center gap-2">
              {hasActiveIncense ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span>✅</span> <span>Bát hương đã thắp — Sẵn sàng dâng nguyện</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <span>⚠️</span> <span>Cần thắp nhang vào bát hương trước</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                hasActiveIncense
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-amber-500/30 hover:scale-105 active:scale-95'
                  : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
              }`}
            >
              <span className="text-lg">✨</span>
              <span>{isSubmitting ? 'ĐANG DÂNG NGUYỆN...' : 'GỬI LỜI CẦU NGUYỆN (SEND PRAYER)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Wish Wall Cards Display */}
      <div>
        <h3 className="text-xl font-bold text-amber-200 mb-4 flex items-center gap-2 font-serif">
          <span>📜</span> Danh Sách Lời Cầu Nguyện Vừa Dâng ({wishes.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishes.map((wish) => (
            <div
              key={wish.id}
              className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                  <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                    <span>👨‍💻</span> {wish.author}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                    tới {wish.targetDeity}
                  </span>
                </div>
                <p className="text-stone-100 text-sm leading-relaxed italic my-2 font-serif">
                  "{wish.text}"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-800/80 mt-3">
                <span>{wish.time}</span>
                <button
                  onClick={() => {
                    wish.blessings = (wish.blessings || 0) + 1;
                    onAddWish({ ...wish });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                >
                  <span>🙏 Phù Hộ</span>
                  <span className="text-amber-400 font-extrabold">{wish.blessings || 1}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
