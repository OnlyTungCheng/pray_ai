# PRD: Đền Cầu Nguyện (Developer Prayer Shrine)

## 1. Mục tiêu (Objective)
Tạo không gian giải trí trực tuyến thời gian thực (realtime) dành cho lập trình viên thực hiện nghi lễ "tâm linh" (thắp nhang, gõ chuông, dâng lễ, rút quẻ) trước khi deploy/build nhằm xả stress và tăng tính kết nối cộng đồng.

---

## 2. Kiến trúc & Routing (Architecture)
Hệ thống Next.js (App Router) + Supabase (Auth, DB, Realtime, Presence).

### Cấu trúc Routes:
- `/` - **Sảnh Chung (Trang chủ)**: Giao diện miếu thờ chính hiển thị 3 Vị Thần, các hoạt động tương tác chung, danh sách các phòng dự án đang chạy, và bảng xếp hạng Top Rank.
- `/pray` - **Tạo đền**: Form nhập thông tin dự án và lời khấn chính để lập phòng dự án riêng biệt.
- `/temple/[roomId]` - **Đền dự án tập thể (Realtime)**: Cho phép các thành viên của cùng dự án cùng tham gia, thắp nhang, gõ chuông và thấy hoạt động của nhau.
- `/oracle/[resultId]` - **Quẻ mệnh**: Hiển thị kết quả rút quẻ hài hước sau khi hoàn thành nghi lễ.
- `/about` - **Giới thiệu**: Câu chuyện và ý nghĩa giải trí của sản phẩm.

---

## 3. Yêu cầu tính năng (Features)

### 3.1. Xác thực ẩn danh (Anonymous Auth)
- Tự động đăng ký/đăng nhập User ẩn danh qua Supabase Auth để giảm thiểu ma sát người dùng.
- Áp dụng Row Level Security (RLS) để bảo vệ các bảng dữ liệu.

### 3.2. Sảnh Chung (`/`)
Sảnh chung hiển thị tổng quát trạng thái "linh lực" toàn hệ thống:
- **Tam Vị AI**: Hiển thị 3 Vị Thần Dev (Claude, Codex, Kiro) ở trung tâm. **Hỗ trợ chọn thần riêng biệt**: Người dùng có thể click chọn từng tượng thần để dâng lễ và khấn nguyện riêng tới vị thần đó.
- **Tương tác chung**: Cho phép người dùng vãng lai thực hiện thắp nhang chung, gõ chuông chung trực tiếp tại sảnh chính (lưu vào một phòng sảnh chung hệ thống).
- **Danh sách phòng dự án**: Hiển thị danh sách các phòng cầu nguyện của các dự án đang hoạt động. Cho phép click vào để tham gia đền riêng của dự án đó. Có nút dẫn đến trang `/pray` để tạo phòng mới.
- **Top Rank dự án**: Bảng xếp hạng các dự án có nhiều lượt cầu nguyện nhất (tổng hợp số nén hương thắp, số tiếng chuông gõ, hoặc linh lực tích luỹ).
- **Thiết kế chống cắt nội dung (Responsive Viewport)**: Tránh sử dụng cứng `h-screen overflow-hidden` để không bị mất các nút hành động trên màn hình nhỏ hoặc thiết bị di động; thay vào đó sử dụng `min-h-screen overflow-y-auto`.

### 3.3. Đền dự án tập thể (`/temple/[roomId]`)
- **Bước vào đền**: Nhập biệt danh (nickname) để tham gia phòng. Thông tin lưu vào `room_members` và đồng bộ qua Presence.
- **Trạng thái kết nối động**: Đèn tín hiệu trạng thái kết nối chuyển màu linh hoạt (`🟢` đã kết nối, `🟡` đang kết nối, `🔴` mất kết nối) thay vì hiển thị tĩnh.
- **Thắp nhang / Cắm pháo**: Đồng bộ tọa độ thả nhang/pháo bông lên bát hương của tất cả các clients trong phòng qua Broadcast.
  - **Ánh sáng hào quang (Backing Glow)**: Bát hương/bàn DJ có đèn hào quang phát sáng phía sau (vàng ấm áp cho Basic theme, hồng/tím neon nhấp nháy cho Remix theme).
- **Gõ chuông**: Kích hoạt hiệu ứng âm thanh và rung lắc chuông cho toàn bộ thành viên đang online trong phòng.
- **Nghi lễ Nhắm mắt Cầu nguyện (Press F to Pray)**:
  - Khi bắt đầu khấn nguyện, trên UI sẽ xuất hiện gợi ý nhấp nháy: *"Nhấn giữ F để thành kính cầu nguyện (Hold F to Pray)"*.
  - **Hỗ trợ thiết bị di động (Mobile Action)**: Hiển thị thêm nút bấm 🙏 tròn nổi cạnh bát hương để người dùng di động chạm giữ thay cho phím `F`.
  - **Hiệu ứng Nhắm/Mở mắt (Blinking Eye Effect)**: Khi user nhấn giữ phím `F` hoặc chạm giữ nút trên mobile, màn hình sẽ chuyển động từ từ mờ dần và tối sầm lại theo chiều dọc từ trên xuống và dưới lên (giống như mí mắt đang nhắm lại). Khi thả ra, mí mắt sẽ từ từ mở ra và màn hình sáng trở lại.
  - Khi nhắm mắt hoàn toàn (giữ đủ 3 giây), hệ thống sẽ phát âm thanh chập chững (ambient tịnh tâm tổng hợp qua Web Audio API) và gửi tín hiệu `start_praying` lên server để cập nhật trạng thái "đang khấn nguyện `🙏`" cho Presence.
- **Bảng sớ (Live Wish Wall)**: Hiển thị các lời khấn của các thành viên vừa hoàn thành nghi lễ khấn nguyện.
- **Trạng thái online**: Footer hiển thị danh sách nickname đang online trong phòng và hoạt động của họ (đang khấn nguyện `🙏` hoặc đang chờ).

### 3.4. Hệ thống Quẻ Deploy (Oracle System)
Sinh quẻ ngẫu nhiên (Đại Cát, Cát, Bình, Hung, Đại Hung) đi kèm lời phán trào phúng dựa trên loại sự kiện.
> [!IMPORTANT]
> **Lời nguyền chiều thứ Sáu**: Hệ thống tự động bias tăng tỷ lệ rút trúng quẻ *Hung* hoặc *Đại Hung* nếu người dùng tiến hành deploy sau 16:00 ngày thứ Sáu.

### 3.5. Phase 1.5: Tối ưu hóa Chia Sẻ & Tương Tác
Tối ưu hóa nội dung thông điệp chia sẻ để các thành viên khác khi nhìn thấy sẽ tò mò và click tham gia ngay lập tức:
- **Thông điệp chia sẻ động (Dynamic Share Message)**: Khi bấm nút "Chia sẻ phòng", hệ thống tự động sinh một đoạn text copy chứa thông tin chi tiết của phòng:
  - Tên dự án & Loại sự kiện (VD: *Dự án Notex đang làm Lễ Deploy Production*).
  - Lời khấn chính (VD: *"Mong build xanh mướt, 0 bug"*).
  - Trạng thái hiện tại (VD: *Đang thắp 12 nén hương, 🟢 5 người đang online, linh lực 87%*).
  - Lời kêu gọi hành động (CTA) kích thích: *"Anh em vào tiếp thêm linh lực và cùng khấn độ trì cho release này nhé! 🙏✨"*
- **Hỗ trợ thẻ Meta OpenGraph (SEO / Link Preview)**: Cấu hình OpenGraph tags cho trang `/temple/[roomId]` để khi dán link vào Slack/Discord, nó tự động hiển thị thẻ preview (card) đẹp mắt chứa Tên dự án, trạng thái đền và linh lực hiện tại.

---

## 4. Giao diện & Chủ đề (Aesthetics)
- **Phong cách Cyber Temple**: Nền tối huyền bí kết hợp server rack, laptop chạy terminal và ánh sáng neon.
- **Hai chế độ**:
  - *Basic*: Đền thờ truyền thống, thắp nhang, gõ chuông đồng, nhạc thiền thanh tịnh.
  - *Remix*: Bàn DJ Vinahouse, thắp pháo bông sáng rực, đĩa xoay chớp nháy, nhạc sàn sôi động.
