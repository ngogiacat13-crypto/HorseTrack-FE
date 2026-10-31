# 📦 Danh Sách Thư Viện Cần & Nên Cài Đặt Cho Dự Án HorseTrack

Tài liệu này tổng hợp các thư viện bổ trợ cần thiết và hữu ích nhất cho dự án **HorseTrack (Hệ thống quản lý huấn luyện & chăm sóc ngựa đua - SWP)**, được phân loại theo từng nghiệp vụ thực tế trong dự án.

---

## 📑 Mục Lục

1. [Quản lý Form &amp; Kiểm tra dữ liệu (Formik, Yup / React Hook Form, Zod)](#1-quản-lý-form--kiểm-tra-dữ-liệu)
2. [Bộ Icon giao diện (Lucide / React Icons / Bootstrap Icons)](#2-bộ-icon-giao-diện)
3. [Biểu đồ &amp; Thống kê (Recharts / Chart.js)](#3-biểu-đồ--thống-kê)
4. [Xử lý Ngày giờ &amp; Lịch hẹn (Day.js, Datepicker)](#4-xử-lý-ngày-giờ--lịch-hẹn)
5. [Hộp thoại xác nhận &amp; Thông báo Toast (SweetAlert2, React-Toastify)](#5-hộp-thoại-xác-nhận--thông-báo-toast)
6. [Quản lý Bảng dữ liệu nâng cao (TanStack Table)](#6-quản-lý-bảng-dữ-liệu-nâng-cao)
7. [Xuất báo cáo &amp; Hóa đơn (Excel, PDF)](#7-xuất-báo-cáo--hóa-đơn)
8. [Lệnh cài đặt tổng hợp (Quick Install)](#8-lệnh-cài-đặt-tổng-hợp)

---

## 1. Quản lý Form & Kiểm tra dữ liệu

### 🔹 Bộ đôi 1: `formik` + `yup` (Theo yêu cầu)

- **Công dụng**:
  - `formik`: Quản lý state của form, handle submit, touch, error message dễ dàng.
  - `yup`: Định nghĩa schema validate dữ liệu (bắt buộc nhập, định dạng email, số điện thoại VN, độ dài mật khẩu, cân nặng ngựa > 0...).
- **Áp dụng trong dự án**:
  - Đăng ký/Đăng nhập, Quên mật khẩu, Đổi mật khẩu.
  - Form đăng ký hồ sơ ngựa mới (Owner).
  - Form tạo phác đồ điều trị, kê đơn thuốc (Vet).
  - Form lập kế hoạch huấn luyện & đề xuất giải đua (Trainer).
- **Lệnh cài đặt**:

```bash
npm install formik yup
npm install -D @types/yup
```

### 💡 Gợi ý thêm: `react-hook-form` + `zod` (Giải pháp thay thế hiện đại)

- Nếu thích hiệu năng cao hơn và TypeScript inference mạnh mẽ hơn:

---

## 2. Bộ Icon giao diện

Dự án hiện đang dùng một số ký tự Unicode text hoặc icon tạm. Cài thư viện icon chuyên nghiệp sẽ giúp giao diện chuẩn dashboard hiện đại:

### 🔹 Lựa chọn tốt nhất: `lucide-react`

- **Ưu điểm**: Nhẹ, cực kỳ đẹp, chuẩn phong cách tối giản hiện đại (Tailwind/Shadcn style).
- **Lệnh cài đặt**:

```bash
npm install lucide-react
```

### 🔹 Hoặc dùng `react-icons` / `bootstrap-icons` (Hợp với React-Bootstrap)

- **Ưu điểm**: Đa dạng icon từ nhiều nguồn (FontAwesome, Bootstrap Icons, Material Icons).

```bash
npm install react-icons
# hoặc
npm install bootstrap-icons
```

---

## 3. Biểu đồ & Thống kê (Charts & Visualizations)

### 🔹 Lựa chọn hàng đầu: `recharts`

- **Công dụng**: Vẽ biểu đồ dạng component của React, dễ tùy biến, responsive tốt.
- **Áp dụng trong dự án**:
  - **Manager Dashboard**: Doanh thu hàng tháng, chi phí thuốc men, tỷ lệ lấp đầy chuồng.
  - **Trainer**: Biểu đồ nhịp tim, tốc độ, quãng đường chạy qua từng phiên tập của ngựa.
  - **Vet**: Thống kê số lượng ca bệnh theo tháng, tỷ lệ hồi phục.
- **Lệnh cài đặt**:

```bash
npm install recharts
```

### 🔹 Lựa chọn thay thế: `chart.js` + `react-chartjs-2`

```bash
npm install chart.js react-chartjs-2
```

---

## 4. Xử lý Ngày giờ & Lịch hẹn

### 🔹 Xử lý ngày giờ: `dayjs`

- **Ưu điểm**: Siêu nhẹ (2KB), cú pháp giống hệt Moment.js cũ, hỗ trợ format ngày tiếng Việt (`DD/MM/YYYY HH:mm`).
- **Áp dụng trong dự án**:
  - Tính tuổi của ngựa từ ngày sinh.
  - Tính số ngày quá hạn thanh toán hóa đơn.
  - Đếm ngược hạn tiêm vắc xin định kỳ.
  - Hiển thị timeline phiên tập và ca khám bệnh.
- **Lệnh cài đặt**:

```bash
npm install dayjs
```

### 🔹 Bộ chọn ngày giờ đẹp: `react-datepicker`

- **Công dụng**: Popup chọn ngày/tháng/năm trực quan hơn input mặc định của trình duyệt.

```bash
npm install react-datepicker
npm install -D @types/react-datepicker
```

---

## 5. Hộp thoại xác nhận & Thông báo Toast

### 🔹 Hộp thoại xác nhận hành động: `sweetalert2`

- **Công dụng**: Thay thế `window.confirm()` và `window.alert()` mặc định bằng popup hiện đại, có animation.
- **Áp dụng trong dự án**:
  - Xác nhận xóa thuốc, xóa phiên tập.
  - Xác nhận duyệt/từ chối hồ sơ đăng ký ngựa của chủ ngựa.
  - Xác nhận khóa tài khoản người dùng (Manager).
- **Lệnh cài đặt**:

```bash
npm install sweetalert2 sweetalert2-react-content
```

### 🔹 Thông báo góc màn hình: `react-toastify` hoặc `sonner`

- **Công dụng**: Bắn thông báo nổi "Lưu thành công", "Lỗi kết nối máy chủ", "Đã gửi phê duyệt".
- **Lệnh cài đặt**:

```bash
npm install react-toastify
# hoặc thư viện siêu mượt:
npm install sonner
```

---

## 6. Quản lý Bảng dữ liệu nâng cao

### 🔹 `tanstack/react-table` (React Table v8)

- **Công dụng**: Bảng phân trang (pagination), sắp xếp (sorting cột theo tên, ngày, trạng thái), tìm kiếm/lọc (filtering).
- **Áp dụng trong dự án**:
  - Bảng danh sách hàng chục/trăm con ngựa (`TrainerHerdOverview`, `VetHerd`).
  - Bảng kho thuốc y tế (`VetMedicines`).
  - Bảng quản lý người dùng và phân quyền (`ManagerUsers`).
  - Bảng lịch sử kiểm toán (`ManagerAuditLogs`).
- **Lệnh cài đặt**:

```bash
npm install @tanstack/react-table
```

---

## 7. Xuất báo cáo & Hóa đơn

### 🔹 Xuất file Excel: `xlsx` (SheetJS)

- **Áp dụng**: Xuất file Excel báo cáo doanh thu, tồn kho vật tư/thuốc, danh sách đàn ngựa phục vụ báo cáo môn SWP.

```bash
npm install xlsx
```

### 🔹 Xuất hóa đơn PDF: `jspdf` + `jspdf-autotable`

- **Áp dụng**: Xuất hóa đơn học phí huấn luyện / chi phí y tế cho Chủ ngựa (Owner) in ra hoặc tải về.

```bash
npm install jspdf jspdf-autotable
```

---

## 8. Lệnh cài đặt tổng hợp (Quick Install)

### 🚀 Gói cơ bản thiết yếu nhất (Nên cài ngay):

Bao gồm: Form validation (`formik` + `yup`), Icon (`lucide-react`), Ngày tháng (`dayjs`), Hộp thoại xác nhận (`sweetalert2`):

```powershell
npm install formik yup lucide-react dayjs sweetalert2 sweetalert2-react-content
npm install -D @types/yup
```

### 🚀 Gói nâng cao (Cho dashboard, biểu đồ & xuất file):

Bao gồm: Biểu đồ (`recharts`), Bảng lọc nâng cao (`@tanstack/react-table`), Xuất Excel (`xlsx`):

```powershell
npm install recharts @tanstack/react-table xlsx
```
