# Ghi chú: FE HorseTrack nối API backend Spring Boot

Backend: `http://localhost:8080` · Swagger: `http://localhost:8080/swagger-ui/index.html`
FE gọi đúng các API trong Swagger này (đường dẫn `/api/v1/...`). Swagger chỉ là trang mô tả và thử API, FE không đi qua trang Swagger.

## 1. Cách chạy

1. Chạy backend (IntelliJ, cổng 8080). Backend kết nối database SQL Server chung của nhóm.
2. Ở thư mục `horse-track`:
   ```bash
   npm install
   npm run dev:be
   ```
3. Mở `http://localhost:5173`, đăng nhập bằng tài khoản trong file `.env.backend`.

- `npm run dev:be` → dùng backend thật (đọc `.env.backend`).
- `npm run dev` → dùng dữ liệu mẫu `db.json` như trước (không cần backend).

Tài khoản thử (đã có trong database chung): xem `.env.backend`
- `manager_admin`: Quản lý CLB
- `test_bacsi`: Bác sĩ thú y
- `test_hlv`: HLV (vai trò `Trainer` trong DB → dùng màn hình HLV trưởng)
- `test_maphu`: Mã phu (Khu A)

## 2. Code nằm ở đâu

| File | Vai trò |
|---|---|
| `src/api/beClient.ts` | Kết nối backend: gọi `/api/v1/...`, gắn Bearer token, tự làm mới token (`/auth/refresh`) khi hết hạn |
| `src/api/hybridAdapter.ts` | Nối dữ liệu: đọc backend rồi đổi sang dạng màn hình dùng (`LOADERS`), gửi thao tác ghi xuống backend (`WRITES`) |
| `src/api/authApi.ts` | Đăng nhập, hồ sơ, đổi mật khẩu, đăng ký chủ ngựa, đăng xuất |
| `src/api/managerApi.ts` | `createStaff`: Quản lý CLB tạo tài khoản nhân viên |
| `src/api/vetApi/raceExamsApi.ts` | `getMedicines`: danh mục thuốc |
| `src/api/http.ts` | Chọn nguồn dữ liệu (backend / db.json), đồng hồ thật khi chạy backend |
| `vite.config.ts` | Chuyển tiếp `/api` → `localhost:8080` (tránh lỗi CORS) |
| `.env.backend` | Bật chế độ backend + tài khoản thử |

Muốn nối thêm API mới: thêm vào `LOADERS` (đọc) hoặc `WRITES` (ghi) trong `src/api/hybridAdapter.ts`.

## 3. API đã nối, theo role

✅ = đã thử trên giao diện với backend thật · ☑️ = đã nối, trang mở được nhưng backend chưa có dữ liệu để thử thao tác

### Chung (mọi role)
| Chức năng | API | |
|---|---|---|
| Đăng nhập | `POST /api/v1/auth/login` → `GET /api/v1/account/my-profile` | ✅ |
| Tự làm mới token | `POST /api/v1/auth/refresh` | ✅ |
| Đăng xuất | `POST /api/v1/auth/logout` | ☑️ |
| Đổi mật khẩu | `PUT /api/v1/account/change-password` | ☑️ |
| Đăng ký chủ ngựa | `POST /api/v1/auth/register-owner` | ☑️ |

### Quản lý CLB (`manager_admin`)
| Màn hình | API | |
|---|---|---|
| Người dùng & phân quyền → Tạo tài khoản nhân viên | `POST /api/v1/auth/staff/create` | ✅ |
| Theo dõi y tế | `GET /api/v1/protocols`, `GET /api/v1/protocols/shipments` | ✅ |
| Bảng điều khiển (số ngựa, chuồng) | `GET /api/v1/horses`, `GET /api/v1/stalls` | ✅ |

### Bác sĩ thú y (`test_bacsi`)
| Màn hình | API | |
|---|---|---|
| Sức khỏe đàn ngựa, Hồ sơ sức khỏe ngựa | `GET /api/v1/horses`, `GET /api/v1/stalls` | ✅ |
| Khóa / mở khóa huấn luyện | `POST /api/v1/medical/vet-lock`, `POST /api/v1/medical/release-lock/{horseId}` | ✅ |
| Hộp thư ca khám, ghi nhận khám | `GET /api/v1/medical/cases`, `POST /api/v1/medical/cases/action` | ☑️ (chưa có ca) |
| Phác đồ điều trị | `GET /api/v1/protocols` | ✅ |
| Danh mục thuốc | `GET /api/v1/medical-management/medications` | ✅ |
| Tiêm phòng & tẩy giun | `GET /api/v1/vaccinations`, `POST /api/v1/vaccinations/{code}/execute`, `POST /api/v1/vaccinations/schedule` | ✅ |
| Khám trước thi đấu | `GET /api/v1/prerace-exams?tab=...`, `POST /api/v1/prerace-exams/{code}/examine` | ✅ |

### HLV (`test_hlv`)
| Màn hình | API | |
|---|---|---|
| Tổng quan đàn ngựa, Hồ sơ huấn luyện ngựa | `GET /api/v1/horses`, `GET /api/v1/training-plans`, `GET /api/v1/training-sessions/my-schedule` | ✅ |
| Sơ đồ chuồng | `GET /api/v1/stalls` | ✅ |
| Giáo án | `GET /api/v1/training-plans` | ✅ |
| Lịch tập | `GET /api/v1/training-sessions/my-schedule` | ☑️ (chưa có phiên) |
| Phân công phiên tập | `POST /api/v1/training-plans/{planId}/sessions` | ❌ backend chỉ cho `Head Trainer` (403) |
| Giải đua & đề xuất | `GET /api/v1/prerace-exams` | ✅ |

### Mã phu (`test_maphu`)
| Màn hình | API | |
|---|---|---|
| Công việc hôm nay, hoàn thành công việc | `GET /api/v1/care-tasks/my-tasks`, `PUT /api/v1/care-tasks/{taskId}/complete` | ☑️ (chưa có công việc) |
| Phiên tập được giao, kết thúc phiên | `GET /api/v1/training-sessions/my-schedule`, `PUT /api/v1/training-sessions/{id}/execute` | ☑️ (chưa có phiên) |
| Sơ đồ chuồng | `GET /api/v1/stalls`, `GET /api/v1/account/my-profile` (khu phụ trách) | ✅ |

### Chủ ngựa
Danh sách ngựa của tôi đọc từ `GET /api/v1/horses` (lọc theo chủ). Chưa có tài khoản chủ ngựa đăng nhập được nên **chưa thử**.

## 4. Chưa nối (backend chưa có API, vẫn dùng dữ liệu mẫu db.json)

- Hóa đơn, thanh toán VNPay theo hóa đơn, đình chỉ dịch vụ, báo cáo tài chính
- Danh sách người dùng, khóa tài khoản, đổi vai trò, nhật ký hệ thống
- Hồ sơ đăng ký ngựa có giấy tờ (hàng chờ duyệt). Backend có `POST /horses/register`, `PUT /horses/{id}/approve` nhưng cấu trúc khác FE, cần thống nhất
- Báo cáo sự cố, yêu cầu vật tư, toàn bộ phần kho (tồn kho, đơn nhập, kiểm kê)
- Đề xuất thi đấu (HLV tạo, chủ ngựa đồng ý), đánh giá phong độ, nhập chỉ số nhịp tim
- Quên mật khẩu (OTP), thông báo

## 5. Lưu ý cho nhóm backend

- `GET /protocols`, `/protocols/shipments`, `/vaccinations`, `/prerace-exams` đang **trả dữ liệu viết cứng trong code**, không đọc database; thao tác ghi chỉ trả "thành công" và mất khi restart.
- Các dữ liệu đó nhắc tới ngựa Bolt, Comet, Thunder, Arrow nhưng bảng `Horses` chỉ có 2 ngựa.
- API tạo nhân viên chỉ nhận `Trainer | Veterinarian | Groom`: không tạo được `Head Trainer` (cần cho giáo án, phân công), chưa có `Warehouse Manager`.
- Tên khu chuồng lẫn lộn "Zone A" / "Khu A" (FE tự đổi về "Khu A").
- Backend chỉ cho CORS `http://localhost:5173`; FE chạy qua proxy của Vite nên không bị ảnh hưởng.

---

## 6. Cập nhật theo backend mới (`Test API 3`, 102 API)

Tài khoản thử mới: `test_kho` (Quản lý kho), mật khẩu giống các tài khoản thử khác (xem `.env.backend`).

### Đã nối thêm
| Chức năng | API | |
|---|---|---|
| Quên mật khẩu: gửi OTP qua email | `POST /api/v1/auth/forgot-password` | ☑️ |
| Quên mật khẩu: đặt mật khẩu mới bằng OTP | `POST /api/v1/auth/reset-password` | ☑️ |
| Đổi mật khẩu: nút "Gửi mã OTP" + ô nhập OTP (chỉ khi chạy backend) | `POST /api/v1/account/change-password/otp`, `PUT /api/v1/account/change-password` (có `otp`) | ☑️ |
| Quản lý CLB tạo tài khoản **Quản lý kho** | `POST /api/v1/auth/staff/create` (`roleName: Warehouse Manager`) | ✅ |

Ghi chú: khi backend chưa cấu hình `MAIL_USERNAME`, email (kể cả mã OTP) chỉ in ra console của server.

### Chưa nối (backend đã có API, việc tiếp theo)
**Quản lý kho** (chỉ role Warehouse Manager gọi được):
- Tồn kho: `GET /inventory/items`, `GET /inventory/low-stock`, `PUT /inventory/items/{id}/safety-level`, `POST /inventory/stock-movements`
- Thuốc theo phác đồ: `GET /inventory/protocols`, `PUT /inventory/protocols/{id}/stock-check`, `PUT /inventory/protocols/{id}/dispense`
- Đơn nhập hàng: `GET/POST /inventory/purchase-orders`, `PUT .../{id}/in-transit | eta | receive | cancel`, `GET /inventory/suppliers`
- Yêu cầu vật tư của Mã phu: `GET /inventory/supply-requests`, `PUT .../{id}/issue | wait-restock | reject`
- Kiểm kê tháng: `GET/POST /inventory/stock-counts`, `PUT .../{id}`, `PUT .../{id}/complete`
- Nhật ký kho: `GET /inventory/transactions`

**Bác sĩ thú y** (phác đồ thật thay cho dữ liệu viết cứng `/protocols`):
- `GET /medical-management/protocols`, `GET .../{id}`, `POST /medical-management/protocols`, `PUT .../{id}/confirm | wait-restock | complete | cancel`, `POST .../{id}/progress-notes | new-version`
- Danh mục thuốc đổi sang `MedicineCatalogDTO` (`itemCode`, `itemName`, `availableStock`) — cần sửa lại hàm `getMedicines`.

**Mã phu:** `POST /supply-requests`, `GET /supply-requests/my`, `PUT /supply-requests/{id}/cancel`.

**HLV:** tạo giáo án `POST /training-plans`. **Công việc chăm sóc:** `POST /care-tasks`.

**Đăng ký ngựa:** `HorseResponseDTO` có `approvalStatus` → nối hàng chờ duyệt của Quản lý CLB (`PUT /horses/{id}/approve`) và form đăng ký của chủ ngựa (`POST /horses/register`).

### Cách làm dự kiến
- Đọc dữ liệu: thêm `inventory`, `shipments`, `requisitions`, `stockChecks`, `stockTx`, `protocols` vào `LOADERS` trong `src/api/hybridAdapter.ts`, chọn API theo vai trò (kho → `/inventory/...`, bác sĩ/QL CLB → `/medical-management/...`).
- Ghi dữ liệu: thay hẳn các hàm trong `warehouseApi`, `vetApi` (phác đồ), `groomApi` (yêu cầu vật tư) bằng lệnh gọi backend, vì backend tự cộng/trừ tồn kho (tránh trừ hai lần).
- Đổi mã: FE dùng mã chữ (`VT-0019`, `PD-0040`, `SHIP-0005`, `RQ-0004`, `KK-2026-10`), backend dùng số (`itemId`, `protocolId`…) → lưu kèm `beId` khi chuyển đổi.

### Cần nhóm backend xem
- Mã phu không gọi được `GET /inventory/items` (403) nên form "Yêu cầu vật tư" không có danh sách vật tư để chọn → cần mở quyền đọc cho Groom hoặc một API danh mục vật tư.
- Vẫn **chưa có API danh sách người dùng / khóa / đổi vai trò** (màn hình Người dùng & phân quyền vẫn là dữ liệu mẫu).
