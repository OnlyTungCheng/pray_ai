Mình hiểu rồi. Đây không phải web “cầu nguyện” theo nghĩa tâm linh nghiêm túc, mà là một **social simulation dành cho dân công nghệ**:

> Trước khi build, deploy, migrate database hoặc release production, mọi người vào “Đền Cầu Nguyện” để thực hiện nghi lễ vui, cùng nhau cầu cho hệ thống bình an.

## Định vị sản phẩm

**Đền Cầu Nguyện** có thể được mô tả là:

> Một không gian giải trí cộng đồng dành cho developer, nơi mọi người cùng thắp hương, gõ chuông, dâng lễ và cầu cho build xanh, deploy thành công, production không lỗi.

Một vài tagline phù hợp:

* **Deploy bình an, production vô sự.**
* **Nơi mọi lời cầu nguyện trước giờ release được lắng nghe.**
* **Code đã viết. Test đã chạy. Phần còn lại xin nhờ tổ nghiệp.**
* **May the build be green.**
* **Không mê tín, chỉ là CI/CD đôi lúc cần niềm tin.**

## Vòng lặp trải nghiệm chính

Người dùng truy cập web và chọn một “điều cầu nguyện”:

* Cầu build không fail.
* Cầu deploy production thành công.
* Cầu migration database không mất dữ liệu.
* Cầu không có bug vào tối thứ Sáu.
* Cầu khách hàng không đổi requirement.
* Cầu reviewer approve PR.
* Cầu server không sập.
* Cầu không phải rollback.

Sau đó người dùng thực hiện một nghi lễ ngắn:

1. Nhập tên dự án hoặc tên bản release.
2. Chọn loại nghi lễ.
3. Thắp hương bằng thao tác kéo hoặc click.
4. Gõ chuông ba lần.
5. Dâng “lễ vật” ảo.
6. Nhấn giữ nút cầu nguyện trong vài giây.
7. Nhận một quẻ hoặc lời phán hài hước.
8. Chia sẻ kết quả cho đồng đội.

Ví dụ kết quả:

> **Quẻ Đại Cát**
> Build có thể xanh, nhưng hãy kiểm tra lại biến môi trường trước khi deploy.

Hoặc:

> **Quẻ Hung Nhẹ**
> Có dấu hiệu thiếu migration. Không nên deploy vào thứ Sáu sau 16:00.

## Tính năng MVP nên có

### 1. Sảnh chính của ngôi đền

Đây nên là màn hình có cảm giác “đang sống”:

* Ngọn lửa và khói hương chuyển động.
* Chuông hoặc mõ có thể tương tác.
* Hiển thị số người đang cầu nguyện.
* Danh sách lời cầu nguyện gần đây.
* Hiệu ứng khi nhiều người cùng cầu nguyện.
* Âm thanh nhẹ, mặc định tắt hoặc hỏi trước khi bật.

### 2. Tạo phiên cầu nguyện

Người dùng nhập:

```text
Tên dự án: Notex
Sự kiện: Deploy production v2.4.0
Lời cầu: Mong build xanh và không lỗi authentication
Thời điểm deploy: 22:00
```

Hệ thống tạo một đường dẫn phòng:

```text
dencau.dev/temple/notex-v2-4
```

Người dùng gửi đường dẫn vào Slack, Discord hoặc nhóm nội bộ để mọi người vào cùng tham gia.

### 3. Nghi lễ tập thể

Trong một phòng, mỗi người có thể:

* Thắp một nén hương.
* Gõ chuông.
* Thả emoji.
* Dâng một lễ vật ảo.
* Viết một câu cầu nguyện.
* Tăng “linh lực deploy” của phòng.

Ví dụ:

```text
🔥 24 nén hương
🔔 63 tiếng chuông
🙏 18 developer đang cầu nguyện
⚡ Linh lực deploy: 87%
```

Điểm số này hoàn toàn mang tính giải trí.

### 4. Lễ vật dành riêng cho developer

Đây là phần tạo cá tính và khả năng viral:

* Một cốc cà phê.
* Một lon nước tăng lực.
* Một bàn phím cơ.
* Một con vịt cao su.
* Một dòng Stack Overflow đã cứu dự án.
* Một file `.env` đầy đủ.
* Một test case cuối cùng.
* Một ngày không họp.
* Một pull request dưới 200 dòng.
* Một lời hứa không deploy thứ Sáu.

### 5. Quẻ deploy

Sau nghi lễ, hệ thống đưa ra kết quả ngẫu nhiên nhưng có tính hài hước:

**Đại cát**

> Pipeline thông suốt, Docker image nhẹ nhàng, production bình an.

**Cát**

> Deploy được, nhưng nên chạy smoke test trước khi thông báo với khách hàng.

**Bình**

> Không thấy điềm xấu, cũng chưa thấy test coverage.

**Hung**

> Có khí lạ từ file `.env.production`. Hãy kiểm tra trước khi tiếp tục.

**Đại hung**

> Thời điểm hiện tại là 16:57 thứ Sáu. Xin quay lại vào sáng thứ Hai.

Nên thêm dòng nhỏ:

> Kết quả chỉ mang tính giải trí. CI/CD vẫn nên dựa vào test, monitoring và rollback plan.

## Các trang chính

Cấu trúc ban đầu chỉ cần khoảng năm route:

```text
/                       Trang ngôi đền
/pray                   Tạo lời cầu nguyện
/temple/[roomId]         Phòng cầu nguyện tập thể
/oracle/[resultId]       Kết quả quẻ deploy
/about                   Giới thiệu câu chuyện sản phẩm
```

Không nên làm dashboard phức tạp ngay từ đầu.

## Stack phù hợp

Với sản phẩm này, mình đề xuất:

### Frontend

* **Next.js App Router**
* **React**
* **TypeScript strict**
* **Tailwind CSS**
* **Motion** cho animation
* **Howler.js** hoặc Web Audio API cho tiếng chuông, tiếng lửa
* **Zustand** cho trạng thái nghi lễ ở client
* **Zod** cho validation

Motion phù hợp cho:

* Khói hương.
* Lửa nến.
* Chuông rung.
* Lễ vật bay vào bàn thờ.
* Thanh linh lực tăng.
* Emoji reaction nổi trên màn hình.

### Backend

MVP có thể dùng **Supabase**:

* Anonymous session.
* Tạo phòng.
* Lưu lời cầu nguyện.
* Realtime reactions.
* Presence để hiển thị số người trong phòng.
* PostgreSQL cho dữ liệu.

Không nhất thiết bắt người dùng đăng nhập. Anonymous-first sẽ giảm ma sát và làm sản phẩm dễ viral hơn.

Sau này mới thêm:

* Đăng nhập GitHub.
* Lịch sử các lần deploy.
* Trang temple của team.
* Bảng xếp hạng.
* Integration với GitHub Actions, Vercel hoặc Slack.

## Kiến trúc trạng thái

Nên chia rõ ba lớp:

### Server state

Lưu trên Supabase:

```ts
type TempleRoom = {
  id: string;
  slug: string;
  projectName: string;
  eventType: "build" | "deploy" | "migration" | "release";
  prayer: string;
  energy: number;
  createdAt: string;
  expiresAt: string;
};
```

### Realtime events

Không cần lưu toàn bộ lâu dài:

```ts
type TempleEvent =
  | { type: "LIGHT_INCENSE"; userId: string }
  | { type: "RING_BELL"; userId: string }
  | { type: "ADD_OFFERING"; offering: string }
  | { type: "REACTION"; emoji: string };
```

### Client UI state

Zustand chỉ giữ:

```ts
type RitualState = {
  currentStep: number;
  incenseLit: boolean;
  bellCount: number;
  selectedOffering?: string;
  soundEnabled: boolean;
};
```

Không đưa toàn bộ dữ liệu phòng vào Zustand nếu dữ liệu đã được quản lý bằng server hoặc realtime subscription.

## Không nên làm quá sớm

Ở giai đoạn đầu chưa cần:

* Microservices.
* Redux.
* TanStack Query nếu phần lớn dữ liệu được render từ server và Supabase Realtime.
* Hệ thống thanh toán.
* Profile người dùng phức tạp.
* AI sinh nội dung cho mọi tương tác.
* Kết nối trực tiếp vào production infrastructure.
* Blockchain, NFT hoặc token “linh lực”.

MVP cần chứng minh ba điều:

1. Người dùng thấy vui ngay trong 30 giây đầu.
2. Người dùng muốn gửi link cho đồng đội.
3. Một nhóm có thể cùng tương tác trong một phòng.

## Hướng phát triển sau MVP

### GitHub integration

Người dùng kết nối GitHub và tạo nghi lễ trực tiếp từ pull request:

```text
Cầu cho PR #829 được approve
Cầu cho release v3.1.0 build thành công
```

### CI/CD integration

Webhook từ GitHub Actions hoặc Vercel cập nhật kết quả:

```text
✅ Build đã thành công
🚀 Deployment đã hoàn tất
❌ Production check thất bại
```

Khi deploy thành công, trong phòng có thể xuất hiện hiệu ứng:

* Pháo giấy.
* Chuông lớn.
* Dòng chữ “Production bình an”.
* Quẻ được đóng dấu “Đã linh nghiệm”.

### Slack bot

Lệnh:

```text
/pray deploy production-v2
```

Bot tạo phòng và gửi vào channel:

> Nghi lễ deploy đã bắt đầu. Mời toàn thể engineering team vào thắp hương.

## Phong cách thiết kế

Không nên thiết kế quá giống một trang tôn giáo thật. Hướng phù hợp hơn là:

* Pixel art hoặc 3D low-poly.
* Cyber temple.
* Đền truyền thống kết hợp terminal, server rack và màn hình CI.
* Màu tối, ánh lửa ấm, điểm nhấn neon.
* Nội dung hài hước theo văn hóa developer.

Một concept hình ảnh mạnh:

> Một ngôi đền cổ nằm giữa data center, hai bên là server rack, phía trước có bàn thờ đặt laptop đang chạy terminal, khói hương tạo thành biểu tượng check màu xanh.

## Phiên bản MVP gọn nhất

Phiên bản đầu tiên chỉ cần:

* Một trang temple đẹp.
* Một form nhập lời cầu nguyện.
* Nghi lễ ba bước: thắp hương, gõ chuông, dâng lễ.
* Một kết quả quẻ ngẫu nhiên.
* Link chia sẻ.
* Realtime counter đơn giản.

Đây là phạm vi đủ nhỏ để làm nhanh nhưng vẫn truyền tải trọn vẹn ý tưởng của **Đền Cầu Nguyện**. Bước hợp lý tiếp theo là chốt **product brief, user flow và cấu trúc component** trước khi bắt đầu code.
