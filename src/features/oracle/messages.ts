import type { OracleTier, PrayerEventType } from './types';

/**
 * Message pools keyed by tier, then by event type.
 * Each pool must have at least one message; `general` is the fallback used
 * for any event type without a dedicated pool entry.
 */
type MessagePool = Partial<Record<PrayerEventType, string[]>> & {
  general: string[];
};

export const ORACLE_MESSAGE_POOLS: Record<OracleTier, MessagePool> = {
  dai_cat: {
    general: [
      'Pipeline thông suốt, Docker image nhẹ nhàng, production bình an.',
      'Mọi test đều xanh. Hôm nay là ngày đẹp để ship code.',
      'Server rack tỏa ánh sáng an lành. Không có gì cản đường deploy của bạn.'
    ],
    build: [
      'Build sẽ chạy êm như chưa từng có warning nào tồn tại.',
      'CI pipeline xanh từ đầu đến cuối. Cứ push đi.'
    ],
    deploy: [
      'Deploy production hôm nay sẽ mượt như chưa từng có config sai.',
      'Zero downtime đang chờ bạn ở phía trước.'
    ],
    migration: [
      'Migration chạy trọn vẹn, không mất một dòng dữ liệu nào.',
      'Backup đã sẵn sàng nhưng có lẽ bạn sẽ không cần dùng đến.'
    ],
    release: [
      'Bản release này sẽ được changelog ghi nhớ vì mọi thứ đều ổn.'
    ],
    server_crash: ['Server hôm nay khỏe mạnh, uptime sẽ đẹp như biểu đồ mẫu.'],
    rollback: ['Sẽ không có rollback nào cần thiết trong tầm nhìn gần.']
  },

  cat: {
    general: [
      'Deploy được, nhưng nên chạy smoke test trước khi thông báo với khách hàng.',
      'Điềm lành nhưng đừng quên checklist trước khi rời máy.'
    ],
    build: ['Build sẽ pass, nhưng nên xem lại log warning một lần cho chắc.'],
    deploy: ['Deploy production khả quan, nhưng nên theo dõi log 15 phút đầu.'],
    migration: ['Migration ổn, nhưng vẫn nên giữ bản backup gần tay.'],
    release: ['Release tốt, chỉ cần double-check version tag trước khi công bố.'],
    pr_review: ['Reviewer sẽ approve, nhưng có thể kèm một vài comment nhỏ.'],
    requirement_change: ['Khách hàng sẽ hài lòng, tạm thời chưa đổi yêu cầu.']
  },

  binh: {
    general: [
      'Không thấy điềm xấu, cũng chưa thấy test coverage.',
      'Mọi thứ trung bình. Kết quả phụ thuộc vào những gì bạn làm tiếp theo.'
    ],
    build: ['Build có thể pass hoặc không — phụ thuộc vào commit cuối cùng.'],
    deploy: ['Deploy sẽ diễn ra, kết quả tốt xấu chưa rõ ràng.'],
    migration: ['Migration khả thi nhưng nên kiểm tra kỹ schema trước khi chạy.'],
    server_crash: ['Server có thể ổn, nhưng theo dõi thêm CPU/memory cho chắc.']
  },

  hung: {
    general: [
      'Có khí lạ từ file `.env.production`. Hãy kiểm tra trước khi tiếp tục.',
      'Điềm báo không tốt. Nên có người túc trực khi deploy.'
    ],
    build: ['Có dấu hiệu dependency chưa lock version. Kiểm tra lại package lock.'],
    deploy: ['Có dấu hiệu thiếu migration. Không nên deploy vào thứ Sáu sau 16:00.'],
    migration: ['Migration có rủi ro mất dữ liệu. Hãy backup trước khi chạy.'],
    friday_night_bug: ['Có bug đang ẩn mình, sẽ xuất hiện đúng lúc bạn định tắt máy.'],
    server_crash: ['Server có dấu hiệu quá tải. Chuẩn bị kế hoạch scale trước khi quá muộn.'],
    rollback: ['Có khả năng cần rollback. Hãy chắc chắn phiên bản trước vẫn còn sẵn.']
  },

  dai_hung: {
    general: [
      'Thời điểm hiện tại là 16:57 thứ Sáu. Xin quay lại vào sáng thứ Hai.',
      'Điềm đại hung. Đừng deploy hôm nay, hãy uống cà phê và đợi ngày mai.'
    ],
    deploy: ['Tuyệt đối không deploy lúc này. Vũ trụ đang không đứng về phía bạn.'],
    migration: ['Migration lúc này có nguy cơ cao. Hãy dừng lại và kiểm tra lại toàn bộ script.'],
    requirement_change: ['Khách hàng sắp đổi yêu cầu ngay khi bạn vừa deploy xong.'],
    rollback: ['Rollback là điều không thể tránh khỏi trong vài giờ tới.']
  }
};

export function pickMessage(
  tier: OracleTier,
  eventType: PrayerEventType,
  random: () => number = Math.random
): string {
  const pool = ORACLE_MESSAGE_POOLS[tier];
  const candidates = pool[eventType] ?? pool.general;
  const index = Math.floor(random() * candidates.length);
  return candidates[Math.min(index, candidates.length - 1)];
}
