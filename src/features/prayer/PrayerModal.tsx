"use client";

import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Wish } from '../../types';

interface PrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWish: (wish: Wish) => void;
  currentDeityName: string;
  hasActiveIncense: boolean;
  themeMode?: string;
}

export default function PrayerModal({
  isOpen,
  onClose,
  onAddWish,
  currentDeityName,
  hasActiveIncense,
  themeMode
}: PrayerModalProps) {
  const [wishText, setWishText] = useState('');
  const [devName, setDevName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isRemix = themeMode === 'remix';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasActiveIncense) {
      setErrorMessage(
        isRemix
          ? '🎧 Vui lòng cắm pháo bông lên Bàn DJ trước khi gửi lời ước!'
          : '⚠️ Vui lòng thắp nhang vào bát hương trước!'
      );
      return;
    }

    if (!wishText.trim()) {
      setErrorMessage(
        isRemix
          ? '🎧 Vui lòng nhập điều ước quẩy bung nóc của bạn!'
          : '⚠️ Vui lòng nhập nội dung tâm nguyện của bạn!'
      );
      return;
    }

    // Submit prayer wish
    onAddWish({
      id: Date.now(),
      author: devName.trim() || (isRemix ? 'Dân Chơi Dev' : 'Lập trình viên'),
      text: wishText.trim(),
      targetDeity: currentDeityName || (isRemix ? '3 Dân Chơi' : 'Tam Vị Thần'),
      blessings: 1,
      time: 'Vừa xong'
    });

    setWishText('');
    onClose(); // Auto back to main screen!
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Modal Dialog Container */}
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh] transition-all ${
          isRemix
            ? 'bg-gradient-to-b from-[#2e1065] via-[#1e0524] to-stone-950 border-2 border-fuchsia-400 shadow-[0_0_80px_rgba(236,72,153,0.8)] text-fuchsia-100'
            : 'bg-stone-900 border-2 border-amber-500/70 shadow-[0_0_60px_rgba(245,158,11,0.4)] text-stone-100'
        }`}
      >
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
          <h2
            className={`text-2xl md:text-3xl font-extrabold font-serif ${
              isRemix ? 'text-pink-300 drop-shadow-[0_0_15px_rgba(236,72,153,1)]' : 'text-amber-200'
            }`}
          >
            {isRemix ? '🪩 GỬI LỜI ƯỚC CÙNG 3 DÂN CHƠI 🪩' : '📜 DÂNG LỜI CẦU NGUYỆN'}
          </h2>
          <p className="text-xs md:text-sm text-stone-300 mt-1 italic">
            {isRemix
              ? '"Quẩy hết mình cùng 3 Dân Chơi, quẩy tan mọi Bug, quẩy tung Production!"'
              : '"Thành tâm nguyện cầu Deploy không bug, Demo suôn sẻ & Server vững như bàn thạch."'}
          </p>
        </div>

        {/* Incense / Sparkler Warning Alert */}
        {!hasActiveIncense && (
          <div
            className={`p-3.5 rounded-xl border text-xs md:text-sm font-semibold flex items-center gap-2 mb-4 animate-pulse ${
              isRemix
                ? 'bg-purple-950/90 border-pink-500 text-pink-200'
                : 'bg-amber-950/90 border-amber-400 text-amber-200'
            }`}
          >
            <span className="text-xl">{isRemix ? '🎧' : '⚠️'}</span>
            <span>
              {isRemix
                ? 'Chưa cắm pháo bông! Vui lòng bấm nút 「🎧」 để thắp pháo lên Bàn DJ trước khi gửi lời ước.'
                : 'Tâm chưa thành — Hương chưa thắp! Vui lòng thắp nhang trước khi dâng lời nguyện.'}
            </span>
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
              <label
                className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                  isRemix ? 'text-pink-400' : 'text-amber-400'
                }`}
              >
                {isRemix ? '🕶️ NICKNAME DÂN CHƠI' : '👤 DANH XƯNG LẬP TRÌNH VIÊN'}
              </label>
              <input
                type="text"
                placeholder={isRemix ? 'Nhập biệt danh quẩy...' : 'Nhập tên hoặc danh xưng...'}
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border text-stone-100 placeholder-stone-600 focus:outline-none text-sm font-medium ${
                  isRemix ? 'border-purple-500 focus:border-pink-400' : 'border-stone-700 focus:border-amber-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                  isRemix ? 'text-pink-400' : 'text-amber-400'
                }`}
              >
                {isRemix ? '🎧 GỬI ĐẾN' : '⛩️ KÍNH DÂNG TỚI'}
              </label>
              <div
                className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border font-bold text-sm flex items-center gap-2 ${
                  isRemix ? 'border-pink-500/50 text-pink-300' : 'border-amber-500/40 text-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${
                    isRemix ? 'bg-pink-400' : 'bg-amber-400'
                  }`}
                />
                <span>{isRemix ? '3 Dân Chơi Vinahouse' : 'Tam Vị Thần'}</span>
              </div>
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                isRemix ? 'text-pink-400' : 'text-amber-400'
              }`}
            >
              {isRemix ? '💬 ĐIỀU ƯỚC BÙNG NỔ' : '💬 NỘI DUNG TÂM NGUYỆN'} <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                isRemix
                  ? 'Ước cho lượt Deploy lúc 5h chiều nay quẩy tưng bừng, 0 bug phát sinh, quẩy nảy loa...'
                  : 'Nguyện cầu cho lượt Deploy chiều nay trơn tru, không có bug phát sinh, demo khách hàng khen ngợi...'
              }
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              className={`w-full px-3.5 py-3 rounded-xl bg-stone-950 border text-stone-100 placeholder-stone-500 focus:outline-none text-sm leading-relaxed resize-none shadow-inner ${
                isRemix ? 'border-purple-500 focus:border-pink-400' : 'border-stone-700 focus:border-amber-400'
              }`}
            />
          </div>

          {/* Submit Action Bar */}
          <div className="pt-3 border-t border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={!hasActiveIncense}
              className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                hasActiveIncense
                  ? isRemix
                    ? 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-purple-600 hover:from-fuchsia-500 text-white shadow-pink-500/40 active:scale-95 cursor-pointer border border-pink-300 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-amber-500/30 active:scale-95 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{isRemix ? '🎆' : '✨'}</span>
              <span>{isRemix ? 'Gửi Lời Ước Quẩy Bằng Pháo' : 'Gửi Lời Nguyện'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
