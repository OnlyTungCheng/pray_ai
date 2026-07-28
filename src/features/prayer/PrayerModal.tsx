import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Wish } from '../../types';

interface PrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWish: (wish: Wish) => void;
  currentDeityName: string;
  hasActiveIncense: boolean;
}

export default function PrayerModal({ isOpen, onClose, onAddWish, currentDeityName, hasActiveIncense }: PrayerModalProps) {
  const [wishText, setWishText] = useState('');
  const [devName, setDevName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasActiveIncense) {
      setErrorMessage('⚠️ Vui lòng thắp nhang vào bát hương trước!');
      return;
    }

    if (!wishText.trim()) {
      setErrorMessage('⚠️ Vui lòng nhập nội dung tâm nguyện của bạn!');
      return;
    }

    // Submit prayer wish
    onAddWish({
      id: Date.now(),
      author: devName.trim() || 'Lập trình viên',
      text: wishText.trim(),
      targetDeity: currentDeityName || 'Tam Vị Thần',
      blessings: 1,
      time: 'Vừa xong'
    });

    setWishText('');
    onClose(); // Auto back to main screen!
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-stone-900 border-2 border-amber-500/70 shadow-[0_0_60px_rgba(245,158,11,0.4)] p-6 md:p-8 overflow-y-auto max-h-[90vh] text-stone-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1.5 text-xl font-bold rounded-lg transition-colors cursor-pointer"
          title="Đóng"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-amber-200 font-serif">
            📜 DÂNG LỜI CẦU NGUYỆN
          </h2>
          <p className="text-xs md:text-sm text-stone-300 mt-1 italic">
            "Thành tâm nguyện cầu Deploy không bug, Demo suôn sẻ & Server vững như bàn thạch."
          </p>
        </div>

        {/* Incense Warning Alert */}
        {!hasActiveIncense && (
          <div className="p-3.5 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-200 text-xs md:text-sm font-semibold flex items-center gap-2 mb-4 animate-pulse">
            <span className="text-xl">⚠️</span>
            <span>Tâm chưa thành — Hương chưa thắp! Vui lòng thắp nhang trước khi dâng lời nguyện.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs md:text-sm font-bold flex items-center justify-between mb-4">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-300 font-bold px-2 text-lg">✕</button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
                👤 DANH XƯNG LẬP TRÌNH VIÊN
              </label>
              <input
                type="text"
                placeholder="Nhập tên hoặc danh xưng..."
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
                ⛩️ KÍNH DÂNG TỚI
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Tam Vị Thần</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
              💬 NỘI DUNG TÂM NGUYỆN <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Nguyện cầu cho lượt Deploy chiều nay trơn tru, không có bug phát sinh, demo khách hàng khen ngợi..."
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm leading-relaxed resize-none shadow-inner"
            />
          </div>

          {/* Submit Action Bar */}
          <div className="pt-3 border-t border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={!hasActiveIncense}
              className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                hasActiveIncense
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-amber-500/30 active:scale-95 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
              }`}
            >
              <span>✨</span>
              <span>Gửi Lời Nguyện</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
