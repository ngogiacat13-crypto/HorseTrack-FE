# HorseTrack · Frontend

Hệ thống quản lý huấn luyện, chăm sóc y tế và tài chính cho câu lạc bộ ngựa đua. Đây là phần giao diện web (FE) của đồ án SWP, kết nối với backend Spring Boot của nhóm.

**Bản chạy thật:** https://horse-track-fe.vercel.app

## Hệ thống làm được gì

Mỗi vai trò đăng nhập vào trang riêng, chỉ thấy đúng phần việc của mình.

| Vai trò | Công việc chính |
| --- | --- |
| **Quản lý CLB** | Bảng điều khiển trong ngày; duyệt hồ sơ đăng ký ngựa và cấp chuồng; quản lý người dùng, phân công HLV theo ngựa và Mã phu theo khu chuồng; phát hành, hủy hóa đơn và phí lưu chuồng; theo dõi y tế, báo cáo tài chính, nhật ký hệ thống và nhật ký email |
| **HLV trưởng** | Lập giáo án, phân công buổi tập cho Mã phu; xử lý buổi tập vượt ngưỡng nhịp tim (cho tập tiếp hoặc dừng và gửi bác sĩ); đánh giá phong độ; giao và theo dõi việc chăm sóc; lên thực đơn dinh dưỡng; đề xuất ngựa thi đấu |
| **Bác sĩ thú y** | Nhận ca bệnh, khám, khóa / mở khóa huấn luyện; lập phác đồ nhiều giai đoạn, gửi kho kiểm tồn, quyết định bắt đầu / kết thúc từng giai đoạn; lịch tiêm phòng và tẩy giun; khám trước thi đấu; duyệt đề nghị đổi khẩu phần |
| **Mã phu (Người chăm ngựa)** | Việc chăm sóc theo ngày với hạn hoàn thành (SLA); thực hiện buổi tập và nhập chỉ số; báo sự cố sức khỏe; yêu cầu vật tư; xác nhận phân công khu chuồng |
| **Quản lý kho** | Tồn kho và lô hàng; kiểm tồn, giữ hàng và cấp phát thuốc theo phác đồ; cấp thức ăn theo thực đơn; duyệt yêu cầu vật tư; đơn nhập hàng, nhà cung cấp; kiểm kê tháng và nhật ký kho |
| **Chủ ngựa** | Đăng ký tài khoản (xác thực OTP email) và đăng ký ngựa kèm giấy tờ; theo dõi tình trạng, tập luyện, điều trị của ngựa; đồng ý / từ chối cho ngựa thi đấu; xem hóa đơn và thanh toán qua VNPay |

Một số luật nghiệp vụ hệ thống tự kiểm tra: buổi tập tự tạm dừng khi vượt ngưỡng nhịp tim, ngựa bị khóa y tế thì không lên giáo án hay thi đấu được, việc chăm sóc trễ quá 45 phút được báo cho Quản lý CLB, phác đồ chỉ cấp thuốc khi giai đoạn đã được thanh toán (trừ ca cấp cứu).

## Công nghệ

- **React 18 + TypeScript**, build bằng **Vite**
- **React Router** (phân quyền theo vai trò), **Redux Toolkit**, **Formik + Yup** (kiểm tra form)
- **Axios** gọi REST API của backend Spring Boot (`/api/v1`), tự gia hạn phiên đăng nhập bằng refresh token
- **Playwright**: kịch bản kiểm thử giao diện chạy tự động cho cả 6 vai trò
- **ESLint + Prettier** với luật riêng của nhóm (thư mục `lint-rules/`)
- **GitHub Actions**: mỗi lần đẩy code đều chạy lint, kiểm tra kiểu và toàn bộ kịch bản kiểm thử
- **Vercel**: tự build và deploy khi nhánh `main` có code mới

## Chạy trên máy

Cần Node.js 20 trở lên.

```bash
npm install
```

Chạy với dữ liệu mẫu, không cần backend (dữ liệu lấy từ `db.json`):

```bash
npm run dev
```

Chạy với backend thật (mặc định backend ở cổng 8080, cấu hình trong `.env.backend`):

```bash
npm run dev:be
```

Mở http://localhost:5173.

Kiểm tra toàn bộ trước khi đẩy code (lint, kiểu dữ liệu, kịch bản Playwright):

```bash
npm run check
```

Build bản production:

```bash
npm run build
```

## Cấu trúc thư mục

```
src/
├── api/          Gọi API: theo từng vai trò, bộ chuyển đổi dữ liệu backend, dữ liệu mẫu
├── auth/         Đăng nhập, phiên làm việc, phân quyền
├── components/   Khung trang, menu, thành phần giao diện dùng chung
├── features/     Tính năng độc lập (thực đơn dinh dưỡng, hóa đơn, giao việc chăm sóc…)
├── hooks/        Hàm React dùng chung (tải dữ liệu, xử lý thao tác)
├── pages/        Màn hình theo vai trò: manager, trainer, vet, groom, warehouse, owner
├── routers/      Định tuyến và chặn truy cập theo vai trò
├── store/        Redux store
├── styles/       Giao diện (CSS) theo từng vai trò
└── utils/        Hàm tiện ích
scenarios/        Kịch bản kiểm thử Playwright
lint-rules/       Luật lint riêng của nhóm
scripts/          Lệnh gộp nhánh dev vào main (npm run merge:main)
.github/          CI: lint, kiểm tra kiểu, kịch bản kiểm thử mỗi lần đẩy code
db.json           Dữ liệu mẫu cho chế độ chạy không cần backend
vercel.json       Cấu hình deploy Vercel
```

## Deploy

Vercel build từ nhánh `main`. File `vercel.json` chuyển các yêu cầu `/api/*` sang server backend, và trả `index.html` cho mọi đường dẫn khác để mở thẳng trang con không bị lỗi 404. Trên Vercel chỉ cần một biến môi trường `VITE_BACKEND=1`.

Nhánh `dev` là nhánh làm việc chung. Nhánh `main` chỉ nhận code đã qua kiểm tra.
