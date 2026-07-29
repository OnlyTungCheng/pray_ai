Mình nghĩ tính năng này nên được định nghĩa thành một hệ thống rất rõ:

> **Mỗi “Điện” là một không gian nghi lễ theo nhóm công cụ. Bên trong Điện có 1–3 vị thần đại diện cho các tool liên quan. Người dùng tạo một “Dự án cầu nguyện” trong Điện, mời mọi người vào cùng cúng dường và đẩy tiến trình nghi lễ.**

## 1. Cấu trúc sản phẩm

Toàn bộ sản phẩm có thể chia thành 3 cấp:

```text
Đền
└── Điện
    └── Dự án cầu nguyện
        └── Người tham gia + hành động + tiến trình
```

### Đền

Là thế giới chung của sản phẩm.

Ví dụ:

```text
Đền Công Nghệ
```

### Điện

Là không gian theo một nhóm nhu cầu hoặc toolchain.

Ví dụ:

* Điện Khai Triển
* Điện Hợp Nhất
* Điện Trí Tuệ
* Điện Dữ Liệu
* Điện Hạ Tầng
* Điện Quan Sát

### Dự án cầu nguyện

Là room do user tạo bên trong một Điện.

Ví dụ:

```text
Điện Khai Triển
└── Project: Notex Production v2.4
```

Mọi người join đúng project đó để cầu chung.

---

# 2. Một Điện gồm những gì?

Mỗi Điện có 4 thành phần:

## Tên Điện

Tên nên có chất cổ nhưng vẫn liên quan rõ tới công nghệ.

Ví dụ:

* **Điện Vạn Sự Khai Triển**
* **Điện Hợp Nhất Vạn Nhánh**
* **Điện Trí Tuệ Vạn Lời**
* **Điện Dữ Hải Trường Tồn**
* **Điện Thiên Vân Vạn Tượng**
* **Điện Minh Giám Vạn Log**

## Bộ thần

Mỗi Điện có 1–3 vị thần.

Ví dụ:

```text
Điện Vạn Sự Khai Triển
- Thần Vercel
- Thần Netlify
- Thần Cloudflare
```

Hoặc:

```text
Điện Hợp Nhất Vạn Nhánh
- Thần GitHub
- Thần GitLab
- Thần Bitbucket
```

## Loại nghi lễ

Mỗi Điện chỉ nên hỗ trợ một nhóm mục tiêu rõ.

Ví dụ Điện Khai Triển:

* build production
* deploy release
* preview deployment
* domain cutover

## Cơ chế cúng dường

Mỗi Điện có bộ hành động riêng:

* dâng log
* thắp hương
* gõ chuông
* dâng `.env`
* hiến test case
* dâng commit
* dâng backup
* gọi hộ thần

---

# 3. Danh sách Điện đề xuất

## Điện Vạn Sự Khai Triển

### Các thần

* Thần Vercel
* Thần Netlify
* Thần Cloudflare

### Dành cho

* build
* deploy
* preview
* CDN
* domain

### Nghi lễ

* dâng preview
* kiểm tra environment
* mở cổng production
* cầu domain propagation

### Visual

* cổng ánh sáng
* các deployment layer
* tam giác, edge node, mạng lưới CDN

---

## Điện Hợp Nhất Vạn Nhánh

### Các thần

* Thần GitHub
* Thần GitLab
* Thần Bitbucket

### Dành cho

* commit
* pull request
* review
* merge
* CI checks

### Nghi lễ

* dâng commit
* xin approve
* soi diff
* giải merge conflict
* hợp nhất nhánh

### Visual

* cây branch
* cổng merge
* các cuộn PR
* check chạy dọc điện

---

## Điện Trí Tuệ Vạn Lời

### Các thần

* Thần OpenAI
* Thần Claude
* Thần Gemini

### Dành cho

* prompt
* context
* reasoning
* tool calling
* structured output

### Nghi lễ

* dâng prompt
* nạp context
* khai schema
* gọi tool
* xin JSON hợp lệ

### Visual

* vòng context
* token ánh sáng
* nhiều cổng giác quan
* các tool spirit

---

## Điện Dữ Hải Trường Tồn

### Các thần

* Thần Supabase
* Thần Firebase
* Thần PostgreSQL

### Dành cho

* migration
* database
* auth
* realtime
* storage

### Nghi lễ

* dâng schema
* ban RLS
* mở realtime
* sao lưu dữ liệu
* chạy migration

### Visual

* kho dữ liệu nhiều tầng
* cổng quyền truy cập
* dòng dữ liệu sáng
* bảo tháp database

---

## Điện Thiên Vân Vạn Tượng

### Các thần

* Thần AWS
* Thần Google Cloud
* Thần Azure

### Dành cho

* infra
* cloud
* compute
* storage
* networking
* autoscaling

### Nghi lễ

* chọn region
* dựng tài nguyên
* cấp IAM
* mở autoscaling
* dâng architecture diagram

### Visual

* mây nhiều tầng
* các cổng dịch vụ
* luồng network
* cụm server như núi điện

---

## Điện Minh Giám Vạn Log

### Các thần

* Thần Sentry
* Thần Datadog
* Thần Grafana

### Dành cho

* monitoring
* error tracking
* observability
* alert
* incident

### Nghi lễ

* dâng stack trace
* soi lỗi
* mở dashboard
* cầu không có incident
* triệu hồi alert

### Visual

* gương log
* nhiều vòng quan sát
* biểu đồ chạy trên tường
* ánh sáng quét như scanner

---

# 4. Người dùng tạo project trong Điện như thế nào?

Luồng nên rất ngắn và tập trung vào trải nghiệm tức thì:

1. **Chỉ có 1 Đền duy nhất.**
2. Bên trong Đền có **nhiều Điện** (ví dụ: Điện Vạn Sự Khai Triển, Điện Trí Tuệ Vạn Lời...).
3. Khi người dùng bấm tạo dự án, họ **chỉ cần nhập các thông tin cơ bản** (Tên dự án, Loại sự kiện, Lời khấn) và tạo ngay. **Không cần phải chọn Thần hay Điện trước khi tạo.**
4. Khi vào phòng dự án, người dùng sẽ được đưa vào một **Điện mặc định**. Ở phần Header của phòng sẽ có chức năng để chuyển sang các Điện khác nếu muốn.

Form tạo đàn lễ chỉ đơn giản là:

```text
Tên project
Notex v2.4

Mục tiêu
Deploy production

Thời gian
22:00 tối nay

Lời cầu
Cầu build xanh, domain ổn định, không rollback
```

Hệ thống sẽ tạo phòng và redirect thẳng vào `/temple/[id]`.

---

# 5. Trải nghiệm khi vào một project

Khi user vào room, họ không chỉ thấy “project”, mà thấy mình đang vào đúng Điện.

## Header

```text
Điện Vạn Sự Khai Triển
Project: Notex Production v2.4
Chủ thần: Vercel
23 người đang cầu
```

## Trung tâm scene

* điện thờ
* tượng hoặc biểu tượng các thần
* bàn thờ project
* lư hương riêng của project
* trạng thái nghi lễ

## Side panel

* người tham gia
* lời cầu gần đây
* tiến trình cúng dường
* các action mới nhất

## Action bar

Tùy từng Điện mà action khác nhau.

Ví dụ Điện Vercel:

```text
[ Dâng Preview ]
[ Thắp hương ]
[ Gõ chuông Build ]
[ Dâng .env ]
[ Mở cổng Production ]
```

---

# 6. Cúng dường là gì trong sản phẩm?

Cúng dường nên vừa là hành động vui, vừa là cơ chế gameplay nhẹ.

Mỗi hành động đóng góp vào một loại năng lượng.

Ví dụ:

```text
Dâng Preview      +10 Build Energy
Dâng Test Case    +15 Stability
Dâng .env         +5 Environment
Gõ chuông         +3 Morale
Gửi lời khấn      +5 Community
```

Room có thể có nhiều thanh tiến trình:

```text
Build Energy      72%
Stability         58%
Community         81%
```

Hoặc chỉ có một thanh chung:

```text
Linh lực project: 2.350 / 3.000
```

Khi đủ ngưỡng:

* thần thức tỉnh
* điện sáng lên
* nghi lễ chuyển phase
* mở action cuối
* ban kết quả

---

# 7. Một project nên có các phase

## Phase 1 — Chuẩn bị

User join, chọn lễ vật, viết lời cầu.

## Phase 2 — Cúng dường

Mọi người:

* thắp hương
* dâng vật phẩm
* gửi lời khấn
* gõ chuông
* hoàn thành mini-task

## Phase 3 — Thỉnh thần

Khi đủ tiến trình:

* thần chính hiển linh
* hộ thần xuất hiện
* cảnh thay đổi
* action cuối được mở

## Phase 4 — Ban kết quả

Kết quả có thể là:

```text
Đại cát
Có thể deploy

Cát
Deploy được nhưng nên kiểm tra environment

Hung nhẹ
Thiếu test hoặc chưa backup

Đại hung
Đang là chiều thứ Sáu
```

## Phase 5 — Ghi công đức

Hệ thống tổng kết:

* ai đóng góp nhiều nhất
* tổng số hương
* tổng lời khấn
* số lễ vật
* thời gian nghi lễ
* kết quả cuối

---

# 8. Một Điện có thể chứa nhiều project cùng lúc

Ví dụ:

```text
Điện Vạn Sự Khai Triển
├── Notex v2.4
├── Payment Service v1.8
├── Landing Page Redesign
└── Mobile Release 3.1
```

Sảnh Điện có thể hiển thị:

```text
Notex v2.4
18 người
Linh lực 76%
Chủ thần Vercel

Payment Service v1.8
12 người
Linh lực 43%
Chủ thần AWS
```

Người dùng có thể:

* join project công khai
* tạo project riêng
* mời team
* follow project
* xem lịch sử nghi lễ

---

# 9. Một project có thể có chủ thần và hộ thần

Đây là phần rất hay.

Ví dụ project:

```text
Notex Production v2.4

Chủ thần
Vercel

Hộ thần
GitHub
Supabase
```

Scene:

* Vercel ở điện chính
* GitHub ở bàn thờ phụ bên trái
* Supabase ở bàn thờ phụ bên phải

Mỗi hộ thần mở thêm action:

```text
GitHub
[ Xin approve ]
[ Dâng commit ]

Supabase
[ Dâng migration ]
[ Khai RLS ]
```

Điều này biến room thành đúng toolchain của project.

---

# 10. Cơ chế chọn thần tự động theo stack

Khi tạo project, user chọn stack:

```text
Source: GitHub
Hosting: Vercel
Database: Supabase
AI: OpenAI
Monitoring: Sentry
```

Hệ thống đề xuất:

```text
Điện chính:
Điện Vạn Sự Khai Triển

Chủ thần:
Vercel

Hộ thần đề xuất:
GitHub
Supabase
```

Các thần khác có thể hiện dưới dạng biểu tượng phụ hoặc buff.

---

# 11. Ví dụ hoàn chỉnh

## Project

```text
Tên:
Notex Production v2.4

Điện:
Điện Vạn Sự Khai Triển

Chủ thần:
Vercel

Hộ thần:
GitHub
Supabase

Mục tiêu:
Deploy production

Thời gian:
22:00

Lời cầu:
Cầu build xanh, migration ổn, realtime không rớt
```

## Khi user join

Họ thấy:

```text
18 người đang cầu nguyện

Build Energy: 74%
Database Safety: 61%
Community Spirit: 82%
```

## Hành động

```text
Dâng Preview
Dâng Commit
Dâng Migration
Thắp hương
Gõ chuông Build
Gửi lời khấn
```

## Khi đủ tiến trình

* Vercel mở cổng production
* GitHub ban dấu approve
* Supabase mở dòng realtime
* cả điện sáng lên

## Kết quả

```text
Đại Cát

Build xanh
Checks passed
Migration an toàn
Realtime ổn định

Production bình an
```

---

# 12. Tên gọi feature trong sản phẩm

Bạn có thể dùng hệ thống tên như sau:

```text
Temple
→ Đền

Hall
→ Điện

Project Room
→ Đàn lễ / Dự án cầu nguyện

Primary Deity
→ Chủ thần

Supporting Deity
→ Hộ thần

Contribution
→ Cúng dường

Progress
→ Linh lực

Event feed
→ Dòng công đức

Result
→ Lời phán / Quẻ kết
```

Ví dụ UI:

```text
Tạo đàn lễ mới
Chọn Điện
Chọn Chủ thần
Mời Hộ thần
Mời người cùng cầu
```

## Hướng chốt

Feature này nên được hiểu là:

> **Một nền tảng multiplayer ritual theo toolchain, nơi mỗi Điện đại diện cho một nhóm công cụ, mỗi project là một room riêng, và mọi người cùng cúng dường để đánh thức các vị thần liên quan tới stack của project.**

Điểm mạnh nhất là:

* có lore;
* có social;
* có room;
* có progression;
* có visual identity;
* có thể mở rộng theo toolchain thật;
* dễ tạo meme và chia sẻ.

Bước tiếp theo hợp lý là chốt một **MVP với 3 Điện**, mỗi Điện 2–3 thần, rồi thiết kế đầy đủ flow tạo project → join room → cúng dường → hiển linh → kết quả.
