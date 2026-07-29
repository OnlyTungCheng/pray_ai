import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giới Thiệu | Đền Cầu Nguyện',
  description: 'Câu chuyện sản phẩm của Đền Cầu Nguyện.'
};

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-[#1c1917] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/50 via-[#181615] to-black text-stone-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-stone-900/85 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8 border-b border-stone-800 pb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-500/20">
            ⛩️ Đền Cầu Nguyện ⛩️
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-serif text-amber-200">
            CÂU CHUYỆN SẢN PHẨM
          </h1>
        </div>

        <article className="space-y-4 text-stone-300 text-sm leading-relaxed">
          <p>
            Trước mỗi lượt <strong>Build, Deploy, Database Migration</strong> hay <strong>Release Production</strong> vào lúc 5 giờ chiều, các lập trình viên thường có một cảm giác lo lắng vô hình. Dù test đã chạy, coverage đã cao, CI/CD đã thiết lập chuẩn chỉnh, nhưng hệ thống vẫn luôn tiềm ẩn những bất ngờ khó đoán.
          </p>
          <p>
            <strong>Đền Cầu Nguyện (Prayer Shrine for Devs)</strong> ra đời không nhằm giải quyết mặt kỹ thuật, mà là một không gian giải trí cộng đồng độc đáo mang đậm văn hóa IT. Đây là nơi các lập trình viên có thể "gửi gắm niềm tin", thắp một nén nhang ảo, gõ vài tiếng chuông vang vọng, dâng vịt cao su hay ly cà phê ảo để cùng cầu chúc cho mọi lượt ship code đều diễn ra <strong>0 bug, 0 downtime và server vững chãi như bàn thạch</strong>.
          </p>
          <blockquote>
            <p className="p-4 italic border-l-4 border-amber-500 bg-stone-950/60 rounded-r-xl my-4 text-stone-200">
              "Code đã viết. Test đã chạy. Phần còn lại xin nhờ tổ nghiệp."
            </p>
          </blockquote>
          <p>
            Dự án sử dụng Next.js kết hợp với Supabase Realtime & Presence nhằm đồng bộ hóa mọi hành động thắp nhang, gõ chuông, khấn nguyện của các thành viên trong cùng một đền thờ trong thời gian thực.
          </p>
        </article>

        <div className="mt-8 pt-6 border-t border-stone-800 text-center">
          <a
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all cursor-pointer shadow-lg"
          >
            Về trang chủ 🙏
          </a>
        </div>
      </div>
    </div>
  );
}
