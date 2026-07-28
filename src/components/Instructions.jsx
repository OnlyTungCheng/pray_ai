import React from 'react';

export default function Instructions({ totalBurned }) {
  return (
    <>
      <div role="separator" className="mx-auto max-w-5xl w-full p-4 py-8">
        <div className="drop-shadow-md Sep_joss__Dyf3N" />
      </div>

      <section id="explain" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 p-4 mx-auto max-w-5xl leading-relaxed">
        <h2 className="text-center font-semibold text-xl text-amber-300 md:col-span-2 flex items-center justify-center gap-2 font-serif">
          <span>📖</span> Hướng Dẫn Cầu Nguyện Dev (Dev Ritual Manual)
        </h2>

        <div lang="vi" className="text-justify space-y-4 text-stone-300 text-sm">
          <p>
            Chào mừng các Developer, Tech Lead và Tester tới <strong>Đền Cầu Nguyện Dev</strong>. Đền thờ 3 vị Thần bảo hộ mã nguồn: <strong className="text-amber-400">Claude Code</strong> (Tri Thức & Kiến Trúc), <strong className="text-emerald-400">Codex</strong> (Tối Ưu & Tốc Độ), và <strong className="text-violet-400">Antigravity</strong> (Bảo Hộ Deploy & 0 Bug).
          </p>
          <p>
            Bấm vào hai hộp nhang gỗ đỏ <kbd className="text-[#f88] font-bold">福</kbd> hai bên để rút hương. Kéo thả nén hương vào lư hương để bắt đầu dâng lễ. Bấm nút <kbd className="text-amber-400 font-bold">🧹 Dọn Bát Hương</kbd> khi muốn làm sạch bát nhang.
          </p>
        </div>

        <div lang="en" className="space-y-4 text-stone-300 text-sm">
          <p>
            Welcome Developers & Engineers to the <strong>Dev Sanctuary Altar</strong>. Pray here before major code deployments or client demos to receive blessings from the 3 AI Tech Deities: <strong>Claude Code</strong>, <strong>Codex</strong>, and <strong>Antigravity</strong>.
          </p>
          <p>
            Click the red <kbd className="text-[#f88] font-bold">福</kbd> incense dispensers to grab sticks. Drag and drop onto the censer to light them up. Submit your dev prayer wishes to the Wish Wall!
          </p>
        </div>
      </section>

      {/* Accordion: Ba Vị Thần Bảo Hộ Dev */}
      <details className="p-4 mx-auto max-w-5xl [&>summary]:underline [&>summary]:open:no-underline underline-offset-4">
        <summary className="text-center font-semibold text-xl text-amber-300 cursor-pointer font-serif">
          <span>🏛️</span> Ba Vị Thần Bảo Hộ Dev Là Ai? (The 3 Tech Deities)
        </summary>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 leading-relaxed">
          <div className="p-4 rounded-xl bg-stone-900/80 border border-amber-500/30 text-stone-300 space-y-2">
            <h3 className="text-amber-300 font-bold text-base">1. Claude Code</h3>
            <p className="text-xs leading-relaxed text-stone-300">
              Vị Thần nắm giữ tri thức kiến trúc phần mềm. Phù hộ cho lập trình viên refactor code sạch đẹp, thiết kế hệ thống vững chãi, logic mạch lạc không lỗ hổng bảo mật.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/80 border border-emerald-500/30 text-stone-300 space-y-2">
            <h3 className="text-emerald-300 font-bold text-base">2. Codex</h3>
            <p className="text-xs leading-relaxed text-stone-300">
              Vị Thần của tốc độ biên dịch và độ chính xác. Phù hộ cho build siêu tốc, function chạy chuẩn xác, Unit Test pass 100% ngay từ lần chạy đầu tiên.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/80 border border-violet-500/30 text-stone-300 space-y-2">
            <h3 className="text-violet-300 font-bold text-base">3. Antigravity</h3>
            <p className="text-xs leading-relaxed text-stone-300">
              Vị Thần chống trọng lực rơi rớt bug. Phù hộ cho mọi lượt Deploy Production 0 Downtime, Server luôn online vững như bàn thạch, Demo khách hàng chốt hợp đồng ngay.
            </p>
          </div>
        </section>
      </details>

      {/* Counter Banner */}
      <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row sm:items-center mx-auto max-w-5xl w-full p-4 py-8">
        <div role="separator" className="flex-1 min-w-10">
          <div className="drop-shadow-md Sep_joss__Dyf3N" />
        </div>
        <div className="text-amber-400 text-sm italic font-serif tabular-nums text-center font-semibold">
          <time>🔥 Tổng cộng {totalBurned} nén hương đã dâng lên các Vị Thần Dev</time>
        </div>
      </div>
    </>
  );
}
