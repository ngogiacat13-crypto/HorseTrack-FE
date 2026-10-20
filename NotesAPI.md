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

### Đã nối thêm: Kho, phác đồ thật, yêu cầu vật tư (đợt 2)
Code: `src/api/beDomain.ts` (đổi dữ liệu backend → dạng màn hình, chọn API theo vai trò), `src/api/beActions.ts` (các thao tác ghi),
`src/api/hybridAdapter.ts` (thêm `inventory`, `requisitions`, `stockChecks`, `stockTx`; `protocols`, `shipments` lấy API thật).
Thao tác ghi của kho / phác đồ gọi thẳng backend (thay hàm cũ trong `warehouseApi`, `vetApi`, `groomApi`) vì backend tự cộng/trừ tồn.

**Quản lý kho** (`test_kho`)
| Màn hình | API | |
|---|---|---|
| Tồn kho, cảnh báo dưới ngưỡng | `GET /inventory/items` | ✅ (9 mặt hàng thật) |
| Cập nhật tồn (nhập / xuất / điều chỉnh) | `POST /inventory/stock-movements` | ☑️ |
| Ngưỡng an toàn | `PUT /inventory/items/{id}/safety-level` | ☑️ |
| Thuốc theo phác đồ (danh sách + chi tiết) | `GET /inventory/protocols`, `GET /inventory/protocols/{id}` | ✅ |
| Kiểm tồn & phản hồi BS, cấp phát | `PUT /inventory/protocols/{id}/stock-check`, `PUT .../dispense` | ☑️ (chưa bấm: PD-0040 là dữ liệu thật của nhóm) |
| Vật tư từ Mã phu: cấp / chờ hàng / từ chối | `GET /inventory/supply-requests`, `PUT .../{id}/issue | wait-restock | reject` | ✅ đọc · ☑️ ghi |
| Đơn nhập hàng: tạo, đang giao, đổi ETA, hủy, nhận hàng | `GET/POST /inventory/purchase-orders`, `PUT .../{id}/in-transit | eta | cancel | receive`, `GET /inventory/suppliers` | ✅ đọc · ☑️ ghi |
| Kiểm kê tháng (tạo phiếu + chốt) | `GET /inventory/stock-counts`, `GET .../{id}`, `POST /inventory/stock-counts`, `PUT .../{id}/complete` | ✅ đọc · ☑️ ghi |
| Nhật ký kho | `GET /inventory/transactions` | ✅ |

**Bác sĩ thú y** (`test_bacsi`)
| Màn hình | API | |
|---|---|---|
| Phác đồ điều trị (danh sách + chi tiết có giai đoạn, phản hồi kho, ghi chú) | `GET /medical-management/protocols`, `GET .../{id}` | ✅ (PD-0038/39/40) |
| Lập phác đồ / phiên bản mới | `POST /medical-management/protocols`, `POST .../{id}/new-version` | ☑️ |
| Xác nhận, chờ hàng, ghi tiến triển, kết thúc, hủy | `PUT .../{id}/confirm | wait-restock | complete | cancel`, `POST .../{id}/progress-notes` | ☑️ |
| Danh mục thuốc (DTO mới `MedicineCatalogDTO`) | `GET /medical-management/medications` | ✅ |

Quản lý CLB → Theo dõi y tế cũng đọc phác đồ thật từ `/medical-management/protocols`.

**Mã phu** (`test_maphu`)
| Màn hình | API | |
|---|---|---|
| Yêu cầu của tôi | `GET /supply-requests/my` | ✅ |
| Gửi yêu cầu vật tư | `POST /supply-requests` | ⚠️ ô chọn vật tư vẫn là dữ liệu mẫu (xem phần cần backend) |

### Chưa nối (để sau)
- **HLV:** tạo giáo án `POST /training-plans` (backend chỉ cho `Head Trainer`; tài khoản `test_hlv` là `Trainer`).
- **Công việc chăm sóc:** `POST /care-tasks` (FE chưa có màn hình tạo công việc).
- **Đăng ký ngựa:** `HorseResponseDTO` có `approvalStatus` → hàng chờ duyệt của Quản lý CLB (`PUT /horses/{id}/approve`) và form đăng ký của chủ ngựa (`POST /horses/register`).
- **Nhà cung cấp:** thêm / sửa (`POST/PUT /inventory/suppliers`), thêm / sửa vật tư (`POST/PUT /inventory/items`) — FE chưa có màn hình.
- **Mã phu hủy yêu cầu:** `PUT /supply-requests/{id}/cancel` — FE chưa có nút hủy.

### Cần nhóm backend xem
- Mã phu không gọi được `GET /inventory/items` (403) → form "Yêu cầu vật tư" chưa có danh sách vật tư thật để chọn. Cần mở quyền đọc cho Groom hoặc thêm API danh mục vật tư.
- Quản lý kho không gọi được `GET /horses` (403) → trang chi tiết phác đồ của kho lấy tên ngựa từ chính phác đồ.
- Vẫn **chưa có API danh sách người dùng / khóa / đổi vai trò** (màn hình Người dùng & phân quyền vẫn là dữ liệu mẫu).
- Lập phác đồ: backend chưa có ca khám nào (`GET /medical/cases` rỗng) nên ô "Ca khám" trên form có thể trống.

---

## 7. Người dùng & Nhật ký hệ thống (backend nhánh `test`, 20/10/2026)

Code backend mới trên GitHub `HuaTrongNghia/HorseTrack`:
- Nhánh **`test`** (commit `9e089ed`) có đủ code → **chạy backend từ nhánh này**.
- Nhánh `main` (commit `9b35f4b`) đang **thiếu các file DTO** (`UserResponseDTO`, `UserPageResponseDTO`, `UserLockRequestDTO`, `UserRoleChangeRequestDTO`, `AuditLogResponseDTO`) nên chưa build được.

### Đã nối (Quản lý CLB — `manager_admin`)
| Màn hình | API | |
|---|---|---|
| Người dùng & phân quyền: danh sách (vai trò, trạng thái, lý do khóa, đăng nhập gần nhất, số công việc mở, số ngựa sở hữu) | `GET /api/v1/users/all` | ✅ |
| Khóa tài khoản (lý do ≥ 10 ký tự) | `PUT /api/v1/users/{id}/lock` | ✅ |
| Mở khóa tài khoản | `PUT /api/v1/users/{id}/unlock` | ✅ |
| Đổi vai trò | `PUT /api/v1/users/{id}/role` | ☑️ |
| Nhật ký hệ thống | `GET /api/v1/audit-logs/paged` | ✅ |

✅ = đã thử với backend nhánh `test` (30 tài khoản thật; khóa → mở khóa `test_hlv` đều 200, nhật ký ghi lại cả hai thao tác). ☑️ = đã nối, chưa thử.
Khi backend chưa có API, hai màn hình tự dùng dữ liệu mẫu như trước (không báo lỗi). Chạy backend nhánh `test` là có dữ liệu thật ngay.

Code: `loadUsers`, `loadAuditLogs` trong `src/api/beDomain.ts` (đăng ký ở `LOADERS` của `hybridAdapter.ts`); khóa / mở khóa / đổi vai trò trong `src/api/managerApi.ts` (`beUserAction`).
Phân công khu chuồng cho Mã phu (nút "Phân công") vẫn là dữ liệu mẫu — backend chưa có API.

---

## 8. Đăng ký ngựa mới (Chủ ngựa → Quản lý CLB duyệt)

Backend không có bảng hồ sơ đăng ký riêng: **hồ sơ = 1 dòng trong bảng `Horses`**.
`stall_id = NULL` → đang chờ duyệt · có `stall_id` → đã duyệt (được cấp chuồng).

| Màn hình | API | |
|---|---|---|
| Chủ ngựa gửi hồ sơ (bắt buộc nhập cân nặng) | `POST /api/v1/horses/register` | ✅ nối |
| Chủ ngựa: "Ngựa của tôi" (chỉ ngựa đã được cấp chuồng) + "Đăng ký ngựa mới" | `GET /api/v1/horses/my-horses/{ownerId}` | ✅ nối |
| Quản lý CLB: hàng chờ duyệt | `GET /api/v1/horses` | ✅ đã thử (hiện đúng Xích Thố, Phi Yến đang chờ) |
| Quản lý CLB: phê duyệt = **chọn chuồng trống** rồi cấp | `PUT /api/v1/horses/{id}/approve` `{stallId}` | ✅ nối (hộp chọn chuồng lấy từ `/stalls`) |
| Từ chối / nộp lại hồ sơ | — | ⏳ backend chưa có API, chỉ lưu tạm trên trình duyệt |

Checklist, giấy tờ đính kèm, màu lông, chiều cao chưa có cột trong DB → chỉ hiện trên màn hình, không lưu. Số hộ chiếu + màu lông được ghi vào cột `pedigree`.
Code: `LOADERS.registrations` + `WRITES.registrations` trong `src/api/hybridAdapter.ts`; hộp chọn chuồng trong `src/pages/manager/ManagerRegistrationDetail/DecisionDialogs.tsx`.
