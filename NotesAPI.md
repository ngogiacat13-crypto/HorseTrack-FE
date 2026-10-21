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

| File                             | Vai trò                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/api/beClient.ts`            | Kết nối backend: gọi `/api/v1/...`, gắn Bearer token, tự làm mới token (`/auth/refresh`) khi hết hạn            |
| `src/api/hybridAdapter.ts`       | Nối dữ liệu: đọc backend rồi đổi sang dạng màn hình dùng (`LOADERS`), gửi thao tác ghi xuống backend (`WRITES`) |
| `src/api/authApi.ts`             | Đăng nhập, hồ sơ, đổi mật khẩu, đăng ký chủ ngựa, đăng xuất                                                     |
| `src/api/managerApi.ts`          | `createStaff`: Quản lý CLB tạo tài khoản nhân viên                                                              |
| `src/api/vetApi/raceExamsApi.ts` | `getMedicines`: danh mục thuốc                                                                                  |
| `src/api/http.ts`                | Chọn nguồn dữ liệu (backend / db.json), đồng hồ thật khi chạy backend                                           |
| `vite.config.ts`                 | Chuyển tiếp `/api` → `localhost:8080` (tránh lỗi CORS)                                                          |
| `.env.backend`                   | Bật chế độ backend + tài khoản thử                                                                              |

Muốn nối thêm API mới: thêm vào `LOADERS` (đọc) hoặc `WRITES` (ghi) trong `src/api/hybridAdapter.ts`.

## 3. API đã nối, theo role

✅ = đã thử trên giao diện với backend thật · ☑️ = đã nối, trang mở được nhưng backend chưa có dữ liệu để thử thao tác

### Chung (mọi role)

| Chức năng        | API                                                          |     |
| ---------------- | ------------------------------------------------------------ | --- |
| Đăng nhập        | `POST /api/v1/auth/login` → `GET /api/v1/account/my-profile` | ✅  |
| Tự làm mới token | `POST /api/v1/auth/refresh`                                  | ✅  |
| Đăng xuất        | `POST /api/v1/auth/logout`                                   | ☑️  |
| Đổi mật khẩu     | `PUT /api/v1/account/change-password`                        | ☑️  |
| Đăng ký chủ ngựa | `POST /api/v1/auth/register-owner`                           | ☑️  |

### Quản lý CLB (`manager_admin`)

| Màn hình                                          | API                                                        |     |
| ------------------------------------------------- | ---------------------------------------------------------- | --- |
| Người dùng & phân quyền → Tạo tài khoản nhân viên | `POST /api/v1/auth/staff/create`                           | ✅  |
| Theo dõi y tế                                     | `GET /api/v1/protocols`, `GET /api/v1/protocols/shipments` | ✅  |
| Bảng điều khiển (số ngựa, chuồng)                 | `GET /api/v1/horses`, `GET /api/v1/stalls`                 | ✅  |

### Bác sĩ thú y (`test_bacsi`)

| Màn hình                               | API                                                                                                          |                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| Sức khỏe đàn ngựa, Hồ sơ sức khỏe ngựa | `GET /api/v1/horses`, `GET /api/v1/stalls`                                                                   | ✅              |
| Khóa / mở khóa huấn luyện              | `POST /api/v1/medical/vet-lock`, `POST /api/v1/medical/release-lock/{horseId}`                               | ✅              |
| Hộp thư ca khám, ghi nhận khám         | `GET /api/v1/medical/cases`, `POST /api/v1/medical/cases/action`                                             | ☑️ (chưa có ca) |
| Phác đồ điều trị                       | `GET /api/v1/protocols`                                                                                      | ✅              |
| Danh mục thuốc                         | `GET /api/v1/medical-management/medications`                                                                 | ✅              |
| Tiêm phòng & tẩy giun                  | `GET /api/v1/vaccinations`, `POST /api/v1/vaccinations/{code}/execute`, `POST /api/v1/vaccinations/schedule` | ✅              |
| Khám trước thi đấu                     | `GET /api/v1/prerace-exams?tab=...`, `POST /api/v1/prerace-exams/{code}/examine`                             | ✅              |

### HLV (`test_hlv`)

| Màn hình                                  | API                                                                                                                      |                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Tổng quan đàn ngựa, Hồ sơ huấn luyện ngựa | `GET /api/v1/horses`, `GET /api/v1/training-plans`, `GET /api/v1/training-sessions/my-schedule`                          | ✅                   |
| Sơ đồ chuồng                              | `GET /api/v1/stalls`                                                                                                     | ✅                   |
| Giáo án: danh sách · tạo mới              | `GET /api/v1/training-plans` · `POST /api/v1/training-plans`                                                             | ✅ · ☑️ (xem mục 10) |
| Lịch tập                                  | `GET /api/v1/training-plans/{planId}` (mọi phiên của từng giáo án; `my-schedule` chỉ trả phiên giao cho chính người gọi) | ✅ (xem mục 10)      |
| Phân công phiên tập                       | `GET /api/v1/training-plans/assignable-staff?planId=`, `POST /api/v1/training-plans/{planId}/sessions`                   | ✅ (xem mục 10)      |
| Giải đua & đề xuất                        | `GET /api/v1/prerace-exams`                                                                                              | ✅                   |

### Mã phu (`test_maphu`)

| Màn hình                                | API                                                                                       |                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| Công việc hôm nay, hoàn thành công việc | `GET /api/v1/care-tasks/my-tasks`, `PUT /api/v1/care-tasks/{taskId}/complete`             | ☑️ (chưa có công việc) |
| Phiên tập được giao, kết thúc phiên     | `GET /api/v1/training-sessions/my-schedule`, `PUT /api/v1/training-sessions/{id}/execute` | ☑️ (chưa có phiên)     |
| Sơ đồ chuồng                            | `GET /api/v1/stalls`, `GET /api/v1/account/my-profile` (khu phụ trách)                    | ✅                     |

### Chủ ngựa

Danh sách ngựa của tôi đọc từ `GET /api/v1/horses` (lọc theo chủ). Chưa có tài khoản chủ ngựa đăng nhập được nên **chưa thử**.

## 4. Chưa nối (backend chưa có API, vẫn dùng dữ liệu mẫu db.json)

- Hóa đơn, thanh toán VNPay theo hóa đơn, đình chỉ dịch vụ, báo cáo tài chính
- Danh sách người dùng, khóa tài khoản, đổi vai trò, nhật ký hệ thống
- Hồ sơ đăng ký ngựa có giấy tờ (hàng chờ duyệt). Backend có `POST /horses/register`, `PUT /horses/{id}/approve` nhưng cấu trúc khác FE, cần thống nhất
- Báo cáo sự cố, yêu cầu vật tư, toàn bộ phần kho (tồn kho, đơn nhập, kiểm kê)
- Đề xuất thi đấu (HLV tạo, chủ ngựa đồng ý), đánh giá phong độ, nhập chỉ số nhịp tim
- Thông báo (quên mật khẩu bằng OTP đã nối, xem mục 6 và 9)

## 5. Lưu ý cho nhóm backend

- `GET /protocols`, `/protocols/shipments`, `/vaccinations`, `/prerace-exams` đang **trả dữ liệu viết cứng trong code**, không đọc database; thao tác ghi chỉ trả "thành công" và mất khi restart.
- Các dữ liệu đó nhắc tới ngựa Bolt, Comet, Thunder, Arrow nhưng bảng `Horses` chỉ có 2 ngựa.
- API tạo nhân viên chỉ nhận `Trainer | Veterinarian | Groom`: không tạo được `Head Trainer` (cần cho giáo án, phân công), chưa có `Warehouse Manager`.
- Tên khu chuồng lẫn lộn "Zone A" / "Khu A" (FE tự đổi về "Khu A", nhưng backend so khớp nguyên văn nên ngựa ở chuồng "Zone A" không có Mã phu nào để phân công — xem mục 10).
- Backend chỉ cho CORS `http://localhost:5173`; FE chạy qua proxy của Vite nên không bị ảnh hưởng.

---

## 6. Cập nhật theo backend mới (`Test API 3`, 102 API)

Tài khoản thử mới: `test_kho` (Quản lý kho), mật khẩu giống các tài khoản thử khác (xem `.env.backend`).

### Đã nối thêm

| Chức năng                                                          | API                                                                                          |     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --- |
| Quên mật khẩu: gửi OTP qua email                                   | `POST /api/v1/auth/forgot-password`                                                          | ☑️  |
| Quên mật khẩu: đặt mật khẩu mới bằng OTP                           | `POST /api/v1/auth/reset-password`                                                           | ☑️  |
| Đổi mật khẩu: nút "Gửi mã OTP" + ô nhập OTP (chỉ khi chạy backend) | `POST /api/v1/account/change-password/otp`, `PUT /api/v1/account/change-password` (có `otp`) | ☑️  |
| Quản lý CLB tạo tài khoản **Quản lý kho**                          | `POST /api/v1/auth/staff/create` (`roleName: Warehouse Manager`)                             | ✅  |

Ghi chú: khi backend chưa cấu hình `MAIL_USERNAME`, email (kể cả mã OTP) chỉ in ra console của server. Chi tiết phần email xem **mục 9**.

### Đã nối thêm: Kho, phác đồ thật, yêu cầu vật tư (đợt 2)

Code: `src/api/beDomain.ts` (đổi dữ liệu backend → dạng màn hình, chọn API theo vai trò), `src/api/beActions.ts` (các thao tác ghi),
`src/api/hybridAdapter.ts` (thêm `inventory`, `requisitions`, `stockChecks`, `stockTx`; `protocols`, `shipments` lấy API thật).
Thao tác ghi của kho / phác đồ gọi thẳng backend (thay hàm cũ trong `warehouseApi`, `vetApi`, `groomApi`) vì backend tự cộng/trừ tồn.

**Quản lý kho** (`test_kho`)

| Màn hình                                               | API                                                                                                    |                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Tồn kho, cảnh báo dưới ngưỡng                          | `GET /inventory/items`                                                                                 | ✅ (9 mặt hàng thật)                            |
| Cập nhật tồn (nhập / xuất / điều chỉnh)                | `POST /inventory/stock-movements`                                                                      | ☑️                                              |
| Ngưỡng an toàn                                         | `PUT /inventory/items/{id}/safety-level`                                                               | ☑️                                              |
| Thuốc theo phác đồ (danh sách + chi tiết)              | `GET /inventory/protocols`, `GET /inventory/protocols/{id}`                                            | ✅                                              |
| Kiểm tồn & phản hồi BS, cấp phát                       | `PUT /inventory/protocols/{id}/stock-check`, `PUT .../dispense`                                        | ☑️ (chưa bấm: PD-0040 là dữ liệu thật của nhóm) |
| Vật tư từ Mã phu: cấp / chờ hàng / từ chối             | `GET /inventory/supply-requests`, `PUT .../{id}/issue                                                  | wait-restock                                    | reject` | ✅ đọc · ☑️ ghi                      |
| Đơn nhập hàng: tạo, đang giao, đổi ETA, hủy, nhận hàng | `GET/POST /inventory/purchase-orders`, `PUT .../{id}/in-transit                                        | eta                                             | cancel  | receive`, `GET /inventory/suppliers` | ✅ đọc · ☑️ ghi |
| Kiểm kê tháng (tạo phiếu + chốt)                       | `GET /inventory/stock-counts`, `GET .../{id}`, `POST /inventory/stock-counts`, `PUT .../{id}/complete` | ✅ đọc · ☑️ ghi                                 |
| Nhật ký kho                                            | `GET /inventory/transactions`                                                                          | ✅                                              |

**Bác sĩ thú y** (`test_bacsi`)

| Màn hình                                                                    | API                                                               |                    |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------ |
| Phác đồ điều trị (danh sách + chi tiết có giai đoạn, phản hồi kho, ghi chú) | `GET /medical-management/protocols`, `GET .../{id}`               | ✅ (PD-0038/39/40) |
| Lập phác đồ / phiên bản mới                                                 | `POST /medical-management/protocols`, `POST .../{id}/new-version` | ☑️                 |
| Xác nhận, chờ hàng, ghi tiến triển, kết thúc, hủy                           | `PUT .../{id}/confirm                                             | wait-restock       | complete | cancel`, `POST .../{id}/progress-notes` | ☑️  |
| Danh mục thuốc (DTO mới `MedicineCatalogDTO`)                               | `GET /medical-management/medications`                             | ✅                 |

Quản lý CLB → Theo dõi y tế cũng đọc phác đồ thật từ `/medical-management/protocols`.

**Mã phu** (`test_maphu`)

| Màn hình           | API                       |                                                            |
| ------------------ | ------------------------- | ---------------------------------------------------------- |
| Yêu cầu của tôi    | `GET /supply-requests/my` | ✅                                                         |
| Gửi yêu cầu vật tư | `POST /supply-requests`   | ⚠️ ô chọn vật tư vẫn là dữ liệu mẫu (xem phần cần backend) |

### Chưa nối (để sau)

- ~~**HLV:** tạo giáo án `POST /training-plans`~~ → đã nối (mục 10); backend hiện cho vai trò `Trainer` (`test_hlv`).
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

| Màn hình                                                                                                                  | API                             |     |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --- |
| Người dùng & phân quyền: danh sách (vai trò, trạng thái, lý do khóa, đăng nhập gần nhất, số công việc mở, số ngựa sở hữu) | `GET /api/v1/users/all`         | ✅  |
| Khóa tài khoản (lý do ≥ 10 ký tự)                                                                                         | `PUT /api/v1/users/{id}/lock`   | ✅  |
| Mở khóa tài khoản                                                                                                         | `PUT /api/v1/users/{id}/unlock` | ✅  |
| Đổi vai trò                                                                                                               | `PUT /api/v1/users/{id}/role`   | ☑️  |
| Nhật ký hệ thống                                                                                                          | `GET /api/v1/audit-logs/paged`  | ✅  |

✅ = đã thử với backend nhánh `test` (30 tài khoản thật; khóa → mở khóa `test_hlv` đều 200, nhật ký ghi lại cả hai thao tác). ☑️ = đã nối, chưa thử.
Khi backend chưa có API, hai màn hình tự dùng dữ liệu mẫu như trước (không báo lỗi). Chạy backend nhánh `test` là có dữ liệu thật ngay.

Code: `loadUsers`, `loadAuditLogs` trong `src/api/beDomain.ts` (đăng ký ở `LOADERS` của `hybridAdapter.ts`); khóa / mở khóa / đổi vai trò trong `src/api/managerApi.ts` (`beUserAction`).
Phân công khu chuồng cho Mã phu (nút "Phân công") vẫn là dữ liệu mẫu — backend chưa có API.

---

## 8. Đăng ký ngựa mới (Chủ ngựa → Quản lý CLB duyệt)

Backend không có bảng hồ sơ đăng ký riêng: **hồ sơ = 1 dòng trong bảng `Horses`**.
`stall_id = NULL` → đang chờ duyệt · có `stall_id` → đã duyệt (được cấp chuồng).

| Màn hình                                                                    | API                                           |                                                      |
| --------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Chủ ngựa gửi hồ sơ (bắt buộc nhập cân nặng)                                 | `POST /api/v1/horses/register`                | ✅ nối                                               |
| Chủ ngựa: "Ngựa của tôi" (chỉ ngựa đã được cấp chuồng) + "Đăng ký ngựa mới" | `GET /api/v1/horses/my-horses/{ownerId}`      | ✅ nối                                               |
| Quản lý CLB: hàng chờ duyệt                                                 | `GET /api/v1/horses`                          | ✅ đã thử (hiện đúng Xích Thố, Phi Yến đang chờ)     |
| Quản lý CLB: phê duyệt = **chọn chuồng trống** rồi cấp                      | `PUT /api/v1/horses/{id}/approve` `{stallId}` | ✅ nối (hộp chọn chuồng lấy từ `/stalls`)            |
| Từ chối / nộp lại hồ sơ                                                     | —                                             | ⏳ backend chưa có API, chỉ lưu tạm trên trình duyệt |

Checklist, giấy tờ đính kèm, màu lông, chiều cao chưa có cột trong DB → chỉ hiện trên màn hình, không lưu. Số hộ chiếu + màu lông được ghi vào cột `pedigree`.
Code: `LOADERS.registrations` + `WRITES.registrations` trong `src/api/hybridAdapter.ts`; hộp chọn chuồng trong `src/pages/manager/ManagerRegistrationDetail/DecisionDialogs.tsx`.

---

## 9. Email (OTP, tài khoản nhân viên) — 21/10/2026

Backend không có API email riêng. `EmailService` (module `notification`) gửi email bên trong 3 API:

| Chức năng                 | API                                                                             | Email gửi đi                 |                                        |
| ------------------------- | ------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------- |
| Quên mật khẩu             | `POST /auth/forgot-password` → `POST /auth/reset-password`                      | Mã OTP đặt lại mật khẩu      | ☑️ API đã thử, chưa bấm trên giao diện |
| Đổi mật khẩu              | `POST /account/change-password/otp` → `PUT /account/change-password` (có `otp`) | Mã OTP đổi mật khẩu          | ☑️ API đã thử, chưa bấm trên giao diện |
| Quản lý CLB tạo nhân viên | `POST /auth/staff/create`                                                       | Tên đăng nhập + mật khẩu tạm | ☑️ (không thử vì sẽ ghi vào DB chung)  |

### Quy tắc OTP (backend, `OtpService`)

- 6 chữ số, hiệu lực **120 giây**, dùng 1 lần, yêu cầu mã mới thì mã cũ mất hiệu lực.
- Nhập sai **5 lần** thì mã bị hủy.
- Giữa 2 lần gửi phải chờ **30 giây** (theo từng email + mục đích).
- Quên mật khẩu luôn trả cùng một câu "Nếu email đã đăng ký…", dù email có tồn tại hay không.
- Mã lưu trong bộ nhớ: restart server là mất hết mã.

### Cấu hình gửi email thật (backend)

Đặt biến môi trường trong Run Configuration của IntelliJ (không ghi mật khẩu vào `application.properties`):

| Biến                                                                 | Ý nghĩa                                                                    | Mặc định                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `MAIL_USERNAME`, `MAIL_PASSWORD`                                     | Tài khoản SMTP. Gmail: bật xác minh 2 bước, dùng **App Password 16 ký tự** | trống → **chế độ dev**: không gửi, in nội dung email (kể cả OTP, mật khẩu tạm) ra console |
| `MAIL_HOST`, `MAIL_PORT`                                             | Máy chủ SMTP                                                               | `smtp.gmail.com`, `587`                                                                   |
| `MAIL_FROM`, `MAIL_FROM_NAME`                                        | Người gửi hiển thị                                                         | `MAIL_USERNAME`, `HorseTrack EquineCare`                                                  |
| `MAIL_WAIT_SECONDS`                                                  | Số giây request chờ email gửi xong để báo kết quả                          | `8`                                                                                       |
| `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS` | Quy tắc OTP                                                                | `120`, `5`, `30`                                                                          |

### Thay đổi phía backend (chưa commit, trong `Test API 3/.../HorseTrack`)

- **Gửi email bất đồng bộ** (`EmailService`): email gửi trên 2 luồng riêng `email-sender`, SMTP chậm (tới ~30 giây) không còn giữ request.
  `sendOtp` / `sendStaffAccount` trả về `CompletableFuture`; `await()` chờ tối đa `app.mail.wait-seconds` và trả `SENT` / `FAILED` / `PENDING`.
  - Quên mật khẩu: không chờ → phản hồi luôn nhanh như nhau (không lộ email nào đã đăng ký qua thời gian phản hồi). Gửi lỗi thì hủy mã để thử lại ngay.
  - OTP đổi mật khẩu: chờ tối đa 8 giây; gửi lỗi → **503** "Không gửi được mã OTP…" và hủy mã. Lỗi đến muộn (sau 8 giây) cũng hủy mã.
  - Tạo nhân viên: chờ tối đa 8 giây rồi báo 1 trong 3: đã gửi / **đang gửi** / không gửi được (tài khoản vẫn được tạo).
- **Thời gian chờ 30 giây an toàn khi gọi đồng thời** (`OtpService.checkAndMarkCooldown` dùng `ConcurrentHashMap.compute`): 10 yêu cầu cùng lúc chỉ 1 yêu cầu được gửi.
- File đã sửa: `EmailService`, `OtpService`, `AuthServiceImpl`, `AccountServiceImpl`, `AuthController`, `application.properties` (thêm `app.mail.wait-seconds`).
- **Phải Restart backend trong IntelliJ** mới có code mới.

Đã thử với bản chạy riêng cổng 8081: bình thường (dev mode), SMTP từ chối kết nối (503 sau ~0,2 giây, gửi lại được ngay), SMTP treo (200 sau ~8,2 giây, sau đó gửi lại được ngay).

### Thay đổi phía FE

| File                                                   | Thay đổi                                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/beClient.ts`                                  | `EMAIL_TIMEOUT = 40000`: 3 API có gửi email chờ tối đa 40 giây (các API khác vẫn 15 giây)                                                          |
| `src/api/authApi.ts`                                   | `requestChangePasswordOtp` trả về **câu thông báo** của backend ("Đã gửi mã OTP tới te******@… Mã có hiệu lực 120 giây.") thay vì chỉ email đã che |
| `src/api/managerApi.ts`                                | `createStaff` trả thêm `emailNote` (thông báo của backend) và `emailFailed`                                                                        |
| `src/pages/manager/ManagerUsers/CreateStaffDialog.tsx` | Toast hiện kết quả gửi email; gửi thất bại thì hiện thêm hộp cảnh báo để Quản lý báo thông tin đăng nhập cho nhân viên theo cách khác              |
| `src/pages/auth/ChangePassword/index.tsx`              | Nút "Gửi mã OTP" đếm ngược 30 giây; danh sách "Yêu cầu mật khẩu" thêm 2 dòng theo quy tắc mới                                                      |
| `src/pages/auth/ForgotPassword/ResetStep.tsx`          | "Gửi lại mã" báo lỗi nếu có (trước đây im lặng); chờ 30 giây (trước là 45); ghi chú "Mã có hiệu lực 120 giây, chỉ dùng một lần"                    |
| `src/components/ui/Ht/password.ts`                     | Quy tắc dùng chung, **giống backend** (`@StrongPassword`, `@ValidUsername`)                                                                        |

Quy tắc tài khoản mới (áp dụng cho Đăng ký, Tạo nhân viên, Đổi mật khẩu, Đặt lại mật khẩu):

- **Mật khẩu:** 8–64 ký tự, có ít nhất 1 chữ cái và 1 chữ số, không chứa khoảng trắng.
- **Tên đăng nhập:** 4–30 ký tự, chỉ gồm chữ không dấu, chữ số, dấu chấm (`.`) và gạch dưới (`_`). Đăng nhập không kiểm tra quy tắc này (tài khoản cũ vẫn vào được).

### Cần nhóm backend xem

- `application.properties` đang ghi thẳng **mật khẩu database** và **JWT secret mặc định** rồi commit lên git → nên chuyển sang biến môi trường và đổi mật khẩu.
- Email tạo nhân viên chứa **mật khẩu tạm ở dạng đọc được (không mã hóa)**; ở chế độ dev mật khẩu này còn in ra console. Nên cân nhắc gửi link đặt mật khẩu thay vì mật khẩu.
- OTP lưu trong bộ nhớ → chạy nhiều instance hoặc restart sẽ mất mã.

---

## 10. Phân công phiên tập cho Mã phu (HLV) — 21/10/2026

Trước đây (chạy `npm run dev:be`) ô **Mã phu** vẫn lấy danh sách mẫu `/grooms` trong `db.json`, và khi gửi chỉ có **tên** Mã phu nên backend báo lỗi (thiếu `assignedToId`). Lịch của HLV cũng luôn trống vì `my-schedule` chỉ trả phiên giao cho chính người gọi.

| Bước trên màn hình "Phân công phiên tập"                                     | API                                                                                           |                                                                       |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Chọn khu → chọn ngựa (ngựa phải có giáo án đang chạy)                        | `GET /horses`, `GET /stalls`, `GET /training-plans`                                           | ✅                                                                    |
| Danh sách Mã phu = Groom đang hoạt động cùng khu chuồng với ngựa của giáo án | `GET /training-plans/assignable-staff?planId=`                                                | ✅ đã thử trên giao diện (`test_hlv`, ngựa Chieu Da → 3 Mã phu Khu A) |
| Gửi cho Mã phu                                                               | `POST /training-plans/{planId}/sessions` `{ sessionDate, activityType, notes, assignedToId }` | ✅ 201 (phiên thử #3, xem dưới)                                       |
| Lịch tập của HLV                                                             | `GET /training-plans/{planId}` cho từng giáo án (`sessions[]` có `assignedToName`)            | ✅                                                                    |

Backend tự kiểm tra khi gửi: giáo án chưa kết thúc/hủy, ngày tập nằm trong thời gian giáo án và không ở quá khứ, ngựa không bị VetLock, người được chọn là Groom đang hoạt động **cùng khu** với ngựa. Lỗi trả về hiện ngay trên hộp thoại.
Chỉ tài khoản vai trò `Trainer` gọi được 2 API phân công (`test_hlv`).

Dữ liệu gửi: `activityType` = "<loại giáo án>", `notes` = "<đường tập> · Ghi nhận: <các chỉ số đã chọn>" (backend chưa có cột chỉ số cần ghi nhận).

Code:

| File                                                 | Thay đổi                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/trainerApi/scheduleApi.ts`                  | `getAssignableGrooms(planId)`; `assignSession` khi chạy backend gọi thẳng `POST /training-plans/{planId}/sessions` với `assignedToId`   |
| `src/pages/trainer/TrainerSchedule/AssignDialog.tsx` | Chọn ngựa xong mới tải Mã phu từ backend; ô Mã phu lưu `id`; báo "Chưa có Mã phu phụ trách …" khi danh sách rỗng                        |
| `src/api/hybridAdapter.ts`                           | `LOADERS.trainingSessions` cho HLV đọc phiên từ `/training-plans/{id}`; bỏ `WRITES.trainingSessions.post` cũ (gửi thiếu `assignedToId`) |

**Đã thử thật (21/10/2026):** `test_hlv` phân công ngựa Chieu Da (giáo án #3) cho **Mã phu Test** (`test_maphu`, id 19), 21/10/2026 09:00 → backend trả 201, tạo **phiên #3** (PENDING).
Phiên hiện trên Lịch tập của HLV, trong `GET /training-plans/3` và trong `my-schedule` của `test_maphu`. Phiên này vẫn nằm trong DB chung; xóa nếu không cần.

### Cần nhóm backend xem

- Cột `TrainingSessions.activity_type` là **VARCHAR(100)** (không phải NVARCHAR) → mất dấu tiếng Việt: phiên #3 lưu thành "Th? l?c · du?ng cát 1200 m". Cần `ALTER TABLE TrainingSessions ALTER COLUMN activity_type NVARCHAR(100) NOT NULL` và sửa lại dòng #3 (cột `notes` là NVARCHAR nên vẫn đúng).
- Chuồng **A-101** (ngựa Bạch Long Mã, giáo án #2) có `barn_zone = 'Zone A'`, còn mọi Groom ghi `Khu A` → `assignable-staff?planId=2` trả rỗng, không phân công được. Cần sửa dữ liệu về cùng một tên khu (hoặc backend chuẩn hóa khi so khớp).
- `POST /{planId}/sessions` không trả id phiên vừa tạo (FE phải tải lại lịch).
- Bảng khu chuồng / Sơ đồ chuồng vẫn lấy Mã phu phụ trách từ dữ liệu mẫu: backend chưa có API danh sách Groom + khu (ngoài `assignable-staff` theo từng giáo án).

### Sửa thêm: Tạo giáo án gửi lên backend (21/10/2026)

**Lỗi gặp:** phân công cho ngựa Xích Thố (Khu B) báo `Failed to convert value of type 'java.lang.String' to required type 'java.lang.Integer'; For input string: "KH-0004"`, dù đã tạo Mã phu Khu B.
**Nguyên nhân:** màn hình "Tạo giáo án" chưa bao giờ gửi lên backend: giáo án chỉ lưu tạm trên trình duyệt với mã giả `KH-0004`, nên backend không có giáo án nào cho Xích Thố (chỉ có #2 Bạch Long Mã, #3 Chieu Da) và `assignable-staff?planId=KH-0004` lỗi.
Mã phu Khu B (**Hứa Nghĩa**, id 34) đã có trên backend; chỉ thiếu giáo án.

| Chức năng   | API                                                                                     |                                               |
| ----------- | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| Tạo giáo án | `POST /training-plans` `{ horseId, planName, startDate, endDate, goal }` → trả `planId` | ☑️ đã nối, chưa bấm thử (sẽ ghi vào DB chung) |

- Backend không lưu loại giáo án và các giai đoạn: FE tính `endDate` = ngày bắt đầu + tổng số tuần của các giai đoạn − 1 ngày, và ghi tóm tắt vào đầu `goal`, ví dụ `[Sức bền · 3 giai đoạn · 8 tuần] <mục tiêu>`.
- Ngày bắt đầu mặc định là **hôm nay** (backend không nhận ngày trong quá khứ).
- Backend tự chặn: ngựa chưa được cấp chuồng, ngựa đang VetLock, ngựa **đã có giáo án ACTIVE** (FE không còn tự "thay thế" giáo án cũ như bản dữ liệu mẫu).
- Giáo án tạo trước bản sửa này chỉ tồn tại trong tab cũ: **tải lại trang rồi tạo lại**. Nếu vẫn còn mã dạng `KH-…`, hộp phân công báo rõ "Giáo án … chưa có trên hệ thống" thay vì lỗi máy chủ.

Code: `src/api/trainerApi/plansApi.ts` (`beCreatePlan`), `src/pages/trainer/TrainerPlanCreate/index.tsx` (ngày bắt đầu mặc định), `src/api/trainerApi/scheduleApi.ts` (`assertBePlan`).

---

## 11. Kiểm tra thực tế với backend (21/10/2026)

Chạy: backend nhánh `test` ở cổng 8080, rồi

```bash
npm run scenarios:live
```

Bộ `scenarios-live/` (Playwright) **chỉ đọc**, không ghi gì vào DB chung. Nó đăng nhập 5 tài khoản trong `.env.backend`, gọi trực tiếp các API GET, bấm qua mọi mục menu, mở các trang chi tiết bằng id thật, và ghi lại mọi lời gọi `/api/v1` (trạng thái HTTP), lỗi JavaScript và khung báo lỗi. Kết quả chi tiết nằm ở `test-results/live-report/<vai-trò>.jsonl`.

| Vai trò     | API đọc (gọi trực tiếp)                                           | Trang + trang chi tiết                                              | Ghi chú                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quản lý CLB | 9/9 trả 200 (`/users/all` 32 tài khoản, `/horses` 5, chờ duyệt 1) | ✅ không lỗi; `REG-0016` (chờ duyệt), `REG-0001` (đã duyệt) mở được | Hóa đơn, Báo cáo tài chính vẫn là dữ liệu mẫu (backend chưa có API)                                                                                                               |
| Bác sĩ      | 11/11 trả 200 (ca khám 0, phác đồ 3, thuốc 4)                     | ✅ `/vet/horses/1`, `/vet/protocols/PD-0040` mở được                | **Đã sửa:** mục "Thức ăn đặc biệt chờ duyệt" trỏ tới ngựa mẫu `h-wind` → trang báo "Không tìm thấy dữ liệu". Khi chạy backend mục này giờ để trống (backend chưa có API)          |
| HLV         | 9/9 trả 200 (giáo án 3, ngựa tập được 2)                          | ✅ `/trainer/horses/1`, `/trainer/sessions/1` mở được               | `assignable-staff?planId=2` trả 0 Mã phu (ngựa của giáo án 2 chưa có Mã phu cùng khu)                                                                                             |
| Mã phu      | 5/5 trả 200 (phiên 1, công việc 0)                                | ✅ `/groom/sessions/3` mở được                                      | ⚠️ Trang **Báo sự cố** gọi `GET /medical/cases` bị **403**: Mã phu không được đọc ca khám → không thấy lại các sự cố mình đã báo. Cần backend mở quyền đọc ca do chính Mã phu tạo |
| Quản lý kho | 10/10 trả 200 (vật tư 9, nhật ký 5)                               | ✅ `/warehouse/medical/PD-0040` mở được                             |                                                                                                                                                                                   |
| Chủ ngựa    | —                                                                 | —                                                                   | Chưa có tài khoản chủ ngựa trong `.env.backend` → chưa thử                                                                                                                        |

**Chưa kiểm tra:** các thao tác **ghi** (tạo/duyệt/khóa/cấp phát…) vì sẽ thay đổi DB chung của nhóm.

---

## 12. Backend commit `04b86e9` (nhánh `test`, 21/10/2026 12:55)

⚠️ **DB đã bị reset** (`DATABASE_reset_all_data.sql` trong commit này): còn `admin` / mật khẩu mặc định trong script (Quản lý CLB), 3 chủ ngựa nhóm mới tạo, **0 chuồng**. Các tài khoản `manager_admin`, `test_*` cũ đã mất (`.env.backend` đã ghi chú).

### Đã nối

| Màn hình                                                                                                                                    | API                                                                            |                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Hàng chờ / chi tiết hồ sơ ngựa: trạng thái thật `PENDING / APPROVED / REJECTED`, mã `HT-xxxx`, màu lông, chiều cao, hộ chiếu, giấy sức khỏe | `GET /horses`, `GET /horses/my-horses/{ownerId}`                               | ✅ đọc (REG-0004 "flash")                                                                |
| Lịch sử hồ sơ (mỗi lần nộp / duyệt / từ chối) + checklist 3 mục đã lưu                                                                      | `GET /horses/{id}/registrations`                                               | ✅ đọc (ngựa hiện có chưa có lần nộp nào trong bảng mới → trả rỗng, FE hiện "gửi hồ sơ") |
| Chủ ngựa gửi hồ sơ: gửi thêm `color`, `heightHands`, `passportNo`, `healthCertIssuer`, `healthCertExpiry` (không nhét vào `pedigree` nữa)   | `POST /horses/register`                                                        | ☑️                                                                                       |
| Phê duyệt: gửi kèm checklist (`IDENTITY/HEALTH/OWNERSHIP`) + ghi chú                                                                        | `PUT /horses/{id}/approve` `{stallId, checks, note}`                           | ☑️ (DB chưa có chuồng nào)                                                               |
| Từ chối (lý do ≥ 10 ký tự, cho/không cho nộp lại)                                                                                           | `PUT /horses/{id}/reject` `{reason, allowResubmit, checks}`                    | ☑️                                                                                       |
| Chủ ngựa sửa và nộp lại                                                                                                                     | `PUT /horses/{id}/resubmit`                                                    | ☑️                                                                                       |
| Mã phu báo sự cố → ca mới cho Bác sĩ                                                                                                        | `POST /medical/cases` `{horseId, caseType, severity, description}`             | ☑️ (cần ngựa ở trong khu của Mã phu)                                                     |
| Mã phu xem lại sự cố đã báo (hết lỗi 403)                                                                                                   | `GET /medical/cases`                                                           | ☑️                                                                                       |
| Bác sĩ ghi nhận khám (bỏ tham số `vetId`) · đóng ca                                                                                         | `POST /medical/cases/action` · `PUT /medical/cases/{caseId}/close` `{outcome}` | ☑️                                                                                       |
| Mã phu chọn vật tư thật khi gửi yêu cầu                                                                                                     | `GET /supply-requests/items`                                                   | ☑️                                                                                       |

### Sửa thêm

- Trang **Theo dõi y tế** (Quản lý CLB) bị sập khi DB không có phác đồ nào → giờ hiện "Chưa có phác đồ điều trị nào" (bộ `scenarios:live` phát hiện).

### Cần nhóm backend / DB

- Không có API tạo chuồng (`/stalls` chỉ đọc) → cần chèn chuồng vào DB bằng SQL, nếu không thì không duyệt được hồ sơ nào và Mã phu không có khu/ngựa.
- Cần tạo lại tài khoản nhân viên để thử (Bác sĩ, HLV, Mã phu có khu, Quản lý kho).

---

## 13. Backend commit `9745ab6` + FE commit của nhóm (21/10/2026 13:38–13:47)

**Backend đang chạy ở cổng 8080 CHƯA có `9745ab6`** (`GET /care-tasks/overdue` trả 500 "No static resource"). Cần pull nhánh `test` và chạy lại backend.

DB hiện có: 15 chuồng `A-01…C-05` (đều CLEAN, trống), 3 Mã phu (Khu A/B/C), 3 Quản lý kho, 3 chủ ngựa, `admin`. Chưa có Bác sĩ, HLV.

### Đã nối thêm

| Màn hình                                                                                                                                                      | API / thay đổi backend          |                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| Bảng điều khiển QL CLB: "Công việc trễ SLA" + số việc trễ (thay dữ liệu mẫu)                                                                                  | `GET /care-tasks/overdue`       | ☑️ (chờ chạy lại backend; chưa có thì giữ dữ liệu mẫu)                              |
| Việc hôm nay của Mã phu: ngày/giờ đúng (`taskDate` + `scheduledTime`), hạn SLA = giờ hẹn + 45 phút, tên việc, chuồng, hướng dẫn, cảnh báo trễ (`warningNote`) | `GET /care-tasks/my-tasks`      | ☑️ — **sửa lỗi cũ**: FE đọc trường `dueDate` không tồn tại nên ngày/giờ luôn là "—" |
| Duyệt hồ sơ: ô chọn chuồng chỉ hiện chuồng trống **CLEAN** (backend chặn chuồng chưa vệ sinh)                                                                 | `PUT /horses/{id}/approve`      | ☑️                                                                                  |
| Nhật ký hệ thống: nhãn tiếng Việt cho `APPROVE_HORSE`, `REJECT_HORSE`, `VET_LOCK`, `VET_UNLOCK`                                                               | `GET /audit-logs/paged`         | ✅                                                                                  |
| Giáo án `PAUSED` (ngựa bị khóa tập)                                                                                                                           | đã hiển thị "Tạm dừng" từ trước | ✅                                                                                  |

Backend tự chặn thêm (FE hiện nguyên thông báo lỗi): Mã phu bị phân 2 buổi tập trùng giờ (60 phút), hoàn thành buổi tập của ngựa đang bị khóa, số điện thoại trùng khi tạo tài khoản.

### FE của nhóm (`4191b17` bỏ "Đổi vai trò", `b3de28e` "Phân công cho HLV")

- ⚠️ **Phân công ngựa cho HLV** chỉ lưu tạm trên trình duyệt khi chạy backend (`PATCH /horses/{id}` `trainerId` không có API backend tương ứng) → tải lại trang là mất. Backend hiện cho mọi HLV thấy mọi ngựa. Cần nhóm backend thêm API phân công nếu muốn giữ chức năng này.
- Đã xóa import `Icon` thừa trong `UserDialogs.tsx` (cảnh báo lint sau khi bỏ "Đổi vai trò").

---

## 14. Backend `86cc948` + `6b843c8` (nhánh `test`, 21/10/2026 14:21–14:55)

**Backend đang chạy ở 8080 vẫn là bản trước `9745ab6`** → `npm run scenarios:live` báo `GET /care-tasks/overdue` 500. Cần pull `test` + chạy lại backend, và chạy script `DATABASE_training_plan_pending_status.sql` (cho phép giáo án `PENDING`), `DATABASE_backfill_assigned_trainer.sql`.

Tài khoản cho `npm run scenarios:live` giờ đặt trong **`.env.live.local`** (chỉ ở máy, đã gitignore), mỗi dòng `#   <username> / <password>`; `.env.backend` không còn chứa mật khẩu.

### Đã nối

| Màn hình                                                                                                                                                       | API                                             |                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| QL CLB → Người dùng → "Phân công" cho HLV (chức năng của nhóm, trước chỉ lưu trên trình duyệt)                                                                 | `PUT /horses/{id}/assign-trainer` `{trainerId}` | ☑️ — backend **chưa có API bỏ phân công**: bỏ chọn ngựa sẽ báo "Hãy phân công HLV khác" |
| Danh sách ngựa: hiện HLV phụ trách (`assignedTrainerId/Name`); HLV chỉ thấy ngựa được phân công (backend lọc)                                                  | `GET /horses`                                   | ☑️                                                                                      |
| Mã phu: nút **"Xác nhận nhận phiên"** (bắt buộc trước khi bắt đầu/hoàn thành; backend chặn xác nhận phiên đã qua giờ)                                          | `PUT /training-sessions/{id}/confirm`           | ☑️                                                                                      |
| Giáo án `PENDING` → "Chưa bắt đầu", `CANCELLED` → "Đã hủy" (tab Lịch sử). Trạng thái chạy do backend quyết định (bỏ tự chuyển ACTIVE phía FE khi chạy backend) | `GET /training-plans`                           | ☑️                                                                                      |
| Nhật ký: nhãn "Phân công HLV phụ trách ngựa" (`ASSIGN_TRAINER`)                                                                                                | `GET /audit-logs/paged`                         | ✅                                                                                      |

### Lưu ý nghiệp vụ mới từ backend

- Giáo án chỉ **ACTIVE** khi có ít nhất 1 phiên được Mã phu xác nhận **và** đã tới ngày bắt đầu (tự kiểm 5 phút/lần).
- HLV chỉ thấy/giao việc cho ngựa được Quản lý CLB phân công → HLV mới tạo sẽ thấy danh sách ngựa trống cho tới khi được phân công.
- Chỉ phân công HLV cho ngựa đã duyệt (có chuồng).

---

## 15. Backend `705c9f4` — Tài chính, VNPay, phác đồ chờ thanh toán (nhánh `test`, 21/10/2026 15:51)

Backend đang chạy ở 8080 **đã có** bản này (134 API). DB chưa có hóa đơn nào (`POST /billing/invoices/generate` chưa chạy) → các màn tài chính hiện số 0.

### Đã nối (code: `src/api/beFinance.ts`)

| Màn hình                                                                                                                                      | API                                                                  |                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| QL CLB · Hóa đơn: danh sách, quá hạn, đình chỉ, chờ kích hoạt lại                                                                             | `GET /billing/invoices`                                              | ✅ đọc (0 hóa đơn)                     |
| QL CLB · Đình chỉ dịch vụ (lý do 10–255 ký tự, chỉ khi nợ ≥ 25 ngày)                                                                          | `PUT /billing/owners/{ownerId}/suspend`                              | ☑️                                     |
| QL CLB · Kích hoạt lại (sau khi chủ ngựa trả đủ qua VNPay)                                                                                    | `PUT /billing/owners/{ownerId}/reactivate`                           | ☑️                                     |
| QL CLB · Báo cáo tài chính: đã thu, phát hành, tỷ lệ thu, theo tháng, theo dịch vụ, tuổi nợ, nợ theo chủ ngựa                                 | `GET /reports/finance`                                               | ✅ đọc                                 |
| Chủ ngựa · Hóa đơn + chi tiết (dòng phí, phí trễ hạn, phí kích hoạt lại, số tiền phải trả hôm nay theo backend)                               | `GET /owner/invoices?includeClosed=true`, `GET /owner/invoices/{id}` | ☑️ (chưa có tài khoản chủ ngựa để thử) |
| Chủ ngựa · Lịch sử thanh toán                                                                                                                 | `GET /owner/invoices/payment-history`                                | ☑️                                     |
| Chủ ngựa · Thanh toán → chuyển sang trang **VNPay Sandbox thật**                                                                              | `POST /owner/invoices/{id}/vnpay` → `paymentUrl`                     | ☑️                                     |
| Chủ ngựa · Quay về sau VNPay: trang Hóa đơn hiện kết quả (`?status=SUCCESS/FAILED/PENDING/INVALID`, testid `vnpay-result`)                    | `GET /payments/vnpay/return` (backend chuyển hướng)                  | ☑️                                     |
| Phác đồ `ON_HOLD_PAYMENT` → "Tạm dừng · chờ chủ ngựa thanh toán" (trước đây FE không biết trạng thái này → hiện sai thành "Chờ kho kiểm tồn") | `GET /medical-management/protocols`                                  | ✅                                     |

Chưa nối (FE chưa có nút): phát hành hóa đơn tháng `POST /billing/invoices/generate`, hủy hóa đơn `PUT /billing/invoices/{id}/cancel`, đặt phí lưu chuồng `PUT /billing/stalls/{stallId}/monthly-fee`. "Gửi nhắc thanh toán" chưa có API backend (chỉ ghi nhật ký trên trình duyệt).

### Cấu hình VNPay (backend, IntelliJ → Environment variables)

`VNPAY_TMN_CODE=…;VNPAY_HASH_SECRET=…` (đăng ký tại sandbox.vnpayment.vn/devreg) và
`VNPAY_FRONTEND_RESULT_URL=http://localhost:5173/owner/invoices` để VNPay quay về đúng trang Hóa đơn của FE.
Script DB cần chạy: `DATABASE_protocol_payment_hold.sql`.

### Còn lại

- Một số chữ cố định trên màn tài chính vẫn là dữ liệu demo ("Quý 3/2026", "tháng 09", "điểm so với Q2", "Tính theo đồng hồ demo 03/10/2026").

---

## 16. Nối nốt API còn lại của backend `705c9f4` (21/10/2026)

Không có commit backend mới trên `test` (`main` chỉ chép lại phần tài chính). Rà toàn bộ 134 API trong Swagger, nối thêm:

| Màn hình                                                                                                                      | API                                                    |                                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| QL CLB · Hóa đơn → nút **"Phát hành hóa đơn tháng"** (chọn kỳ, gọi lại không tạo trùng)                                       | `POST /billing/invoices/generate?billingMonth=yyyy-MM` | ☑️ mở được hộp thoại, chưa bấm (ghi DB) |
| QL CLB · Hóa đơn → nút **"Hủy"** trên hóa đơn chưa trả (lý do 10–255 ký tự)                                                   | `PUT /billing/invoices/{id}/cancel`                    | ☑️                                      |
| QL CLB · Hóa đơn → nút **"Phí lưu chuồng"** (chọn chuồng, nhập phí/tháng)                                                     | `PUT /billing/stalls/{stallId}/monthly-fee`            | ☑️ danh sách chuồng thật tải đúng       |
| Mã phu · Yêu cầu vật tư → nút **"Hủy"** (khi kho chưa xử lý xong: Mới gửi / Đang kiểm tồn / Chờ hàng)                         | `PUT /supply-requests/{id}/cancel`                     | ☑️                                      |
| Chủ ngựa · Ngựa của tôi / Chi tiết ngựa: giáo án + buổi tập thật (trước đây gọi `/training-plans` bị chặn quyền → luôn trống) | `GET /owner/training/horses/{id}/progress`             | ☑️                                      |

Code mới theo quy chuẩn: `src/features/invoice-billing/` (billingApi, 3 hộp thoại, BillingActions).

### Chưa nối (có lý do)

- `/api/...` (không có `v1`): bản trùng đường dẫn cũ của các API đã nối.
- `POST /veterinary/medical-records`, `PUT /manager/medical-records/{id}/approve`, `POST /owner/payments/medical-records/{id}/vnpay`: luồng hồ sơ y tế cũ, đã được thay bằng phác đồ + hóa đơn theo giai đoạn.
- `POST /nutrition-plans`, `GET /horses/{id}/nutrition-plan/today`: khẩu phần theo vật tư kho; màn "Chế độ ăn" của Bác sĩ trên FE đang dùng mô hình khác (thức ăn đặc biệt) → cần thống nhất với nhóm.
- `GET /training-plans/dashboard-stats`, `GET /inventory/low-stock`, `GET /billing/owners/{id}/service`, `PUT /inventory/suppliers/{id}`: FE đã tự tính từ dữ liệu khác hoặc chưa có màn hình.

---

## 17. Phân công theo khu (FE `f6f334d` của nhóm) — nối backend

Backend không có commit mới. Commit FE `f6f334d` đổi "Phân công" sang chọn **khu**; khi chạy backend:

| Thao tác                                | Backend                                                                                  | FE xử lý                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Tạo tài khoản **Mã phu** + chọn khu     | `POST /auth/staff/create` lưu khu vào `specialization` (`GroomProfile.assignedBarnZone`) | ✅ giữ nguyên                                                                            |
| Tạo tài khoản **HLV** + chọn khu        | Backend **bỏ qua** khu của Trainer (bảng `TrainerProfile` không có cột khu)              | Sau khi tạo, FE gọi `PUT /horses/{id}/assign-trainer` cho mọi ngựa đã duyệt trong khu đó |
| "Phân công" HLV theo khu                | `PUT /horses/{id}/assign-trainer` cho từng ngựa trong khu                                | ✅; khu của HLV hiển thị = khu của các ngựa được giao (lấy từ `assignedTrainerId`)       |
| "Phân công" đổi khu Mã phu              | **Không có API** đổi khu sau khi tạo                                                     | Báo lỗi rõ ràng thay vì lưu tạm trên trình duyệt (trước đây tải lại trang là mất)        |
| Danh sách nhân viên trong hộp phân công | `GET /users/all`                                                                         | Bỏ danh sách Mã phu mẫu (db.json) khi chạy backend, chỉ dùng nhân viên thật              |

Cần nhóm backend: API đổi khu cho Mã phu (vd `PUT /users/{id}/zone`), và cột khu cho Trainer nếu muốn lưu khu HLV riêng.

---

## 18. HLV phụ trách ngựa ở nhiều khu (21/10/2026)

Quyết định: **không phân khu cho HLV**. Quản lý CLB chọn **từng con ngựa** cho HLV, ở khu nào cũng được (vd HLV ToanNgo: 2 ngựa khu A, 1 khu B, 1 khu C). Mã phu vẫn phân theo khu.

| Chỗ thay đổi                            | Trước                                      | Sau                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QL CLB → Người dùng → "Phân công" (HLV) | Chọn khu → giao mọi ngựa trong khu         | Hộp `TrainerHorsesDialog`: danh sách ngựa đã duyệt nhóm theo khu, tick từng con; hiện "Đang do HLV khác phụ trách" (sẽ được bàn giao kèm giáo án) và tổng "Khu A 2 · Khu B 1 · Khu C 1" |
| Tạo tài khoản HLV                       | Bắt buộc chọn khu (backend lại bỏ qua)     | Không còn ô khu; chỉ Mã phu chọn khu                                                                                                                                                    |
| API                                     | `PUT /horses/{id}/assign-trainer` theo khu | `PUT /horses/{id}/assign-trainer` cho đúng các ngựa được tick                                                                                                                           |

Bỏ tick một ngựa đang do HLV này phụ trách: backend chưa có API bỏ phân công → FE báo "Hãy phân công HLV khác cho …".
Kịch bản tự kiểm: `scenarios/trainer-horses.spec.ts`.

> **Gộp với commit nhóm `cb690b8` "phân khu" / `2aa1c1d` (17:02–17:05):** commit này bắt HLV và Mã phu chọn **đúng 1 khu**, mỗi khu 1 người. Đã gộp theo quyết định mới: **HLV chọn từng ngựa ở nhiều khu** (mục 18), **Mã phu giữ quy tắc 1 khu / 1 người** của nhóm (khu đã có người chăm bị khóa). Nút trên bảng người dùng: "Phân công ngựa" (HLV) · "Phân khu" (Mã phu). Kịch bản: `scenarios/trainer-horses.spec.ts`, `scenarios/groom-zone.spec.ts`.


---

## 19. Kiểm tra toàn bộ luồng với dữ liệu thật (21/10/2026 21:50)

Trạng thái lúc test: BE nhánh `test` `91b3864` (backend chạy từ 20:31, 136 API) · FE nhánh `dev` `04dc072` · DB chung `EquineCareDB`.
Cách test: 95 bước gọi thẳng API backend (**94/95 đạt**) + đăng nhập giao diện FE (5173, chế độ backend) bằng từng vai trò. Không sửa code.

### Dữ liệu QA đã tạo trong DB chung (để nhóm nhận ra / dọn sau)
- Tài khoản (mật khẩu chung cho cả 5: `Qa16010x9`): `qa_bacsi_16010` (Bác sĩ, id 31), `qa_hlv_16010` (HLV, 32), `qa_maphu_16010` (Mã phu Khu A, 33), `qa_kho_16010` (Kho, 34), `qa_chungua_16010` (Chủ ngựa, 35).
- Ngựa: **QA Alpha 16010** (duyệt, chuồng A-04), **QA Gamma 16010** (duyệt, A-05, đã khóa rồi mở khóa y tế), **QA Beta 16010** (từ chối → nộp lại → từ chối hẳn).
- Khác: phác đồ PD-1011, ca khám C-0009, yêu cầu vật tư RQ-0001 (đã cấp) / RQ-0002 (đã hủy), hóa đơn giai đoạn GD-001011-01 (240.000 ₫, chưa trả), 1 việc chăm sóc, 2 giáo án QA.

### Luồng chạy đúng ✅
| Luồng | Đã kiểm tra |
|---|---|
| Hồ sơ ngựa | Gửi → duyệt + cấp chuồng / từ chối có lý do → nộp lại → từ chối hẳn. Chặn đúng: checklist chưa đạt, chuồng đã có ngựa, lý do < 10 ký tự, nộp lại khi không được phép |
| Phân công HLV | HLV chỉ thấy đúng ngựa được giao; xem ngựa khác → 403; không giao được ngựa bị từ chối |
| Giáo án & phiên tập | Tạo (PENDING) → phân công Mã phu → Mã phu xác nhận → ACTIVE → hoàn thành → HLV chấm 8/10. Chặn đúng: giáo án trùng, Mã phu trùng giờ, hoàn thành khi chưa xác nhận, điểm > 10 |
| Khóa y tế | Khóa → ngựa INJURED, phiên bị hủy, không xếp/xác nhận được phiên → mở khóa → xếp lại được |
| Ca khám | Mã phu báo → Bác sĩ khám (MONITORING) → đóng ca; Mã phu báo ngựa ngoài khu → chặn |
| Phác đồ & kho | Lập → kho kiểm tồn → BS xác nhận → tự lập hóa đơn giai đoạn (BR_16) → kho cấp thuốc → ghi tiến triển |
| Vật tư | Mã phu thấy 12 vật tư thật → gửi / hủy → kho cấp phát |
| Việc chăm sóc | HLV giao → Mã phu hoàn thành; giao cho ngựa không phụ trách → chặn |
| Tài chính | Hóa đơn giai đoạn hiện cho chủ ngựa; báo cáo tài chính; đình chỉ khi nợ < 25 ngày → chặn |
| Tài khoản | Khóa → không đăng nhập được → mở khóa → đăng nhập lại được |
| Giao diện | Trang của HLV, Mã phu, Bác sĩ, Kho, Chủ ngựa, QL CLB đều hiện đúng dữ liệu QA vừa tạo |

### Vấn đề — Backend
1. ❌ **Thanh toán VNPay lỗi 503**: chưa cấu hình `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` → chủ ngựa không trả tiền được.
2. **Giáo án tự "Hoàn tất" sau 1 phiên**: giáo án 30 ngày của QA Alpha thành `COMPLETED` ngay khi phiên duy nhất hoàn thành (backend coi hết phiên đang mở = xong giáo án).
3. **Phát hành hóa đơn tháng 10 tạo 0 hóa đơn**: cả 11 ngựa bị bỏ qua vì tổng phí 0 đồng — chưa chuồng nào đặt phí lưu chuồng.
4. **Nhật ký hệ thống thiếu nhiều thao tác** (BR_10): không ghi tạo giáo án, phân công phiên, báo sự cố, lập phác đồ, yêu cầu vật tư, giao việc chăm sóc, gửi hồ sơ ngựa.
5. **Lô hàng giả "SHIP-0024 · PD-0011"** vẫn hiện (trang Phác đồ của BS, bảng điều khiển QL CLB) vì `/protocols/shipments` viết cứng trong code.
6. Kho · "Thuốc theo phác đồ": ô "Đã cấp phát" = 0 dù PD-1011 vừa cấp (API chỉ trả phác đồ còn chờ xử lý).

### Vấn đề — Frontend
7. **Mã phu · Công việc hôm nay: SLA sai khi qua nửa đêm** — việc hẹn 23:30 hoàn thành 21:54 (sớm) nhưng hiện "trễ 1299 phút SLA".
8. **Mã hồ sơ lệch**: FE đặt mã theo id ngựa (QA Beta hiện "REG-0016") khác mã thật của backend (REG-0016 thật là của QA Alpha, QA Gamma là REG-0018) → dễ nhầm.
9. **Chủ ngựa không thấy phác đồ đang điều trị**: QA Alpha có PD-1011 "Đang điều trị" nhưng "Ngựa của tôi" ghi "Điều trị: Không có".
10. HLV · Tổng quan / Giáo án: chủ ngựa hiện "Chủ ngựa #35" thay vì tên.
11. Bác sĩ · Sức khỏe đàn ngựa đếm 13 ngựa, gồm cả ngựa bị từ chối (không ở CLB).
12. Mã phu · Yêu cầu vật tư: yêu cầu đã hủy hiện "Đã đóng"; nút "Đã nhận" không có API backend (chỉ lưu trên trình duyệt).
13. `npm run lint` lỗi 2 comment ở `src/api/managerApi.ts` (dòng 317, 341 — commit `3be3166`) → CI đỏ.
14. Còn dữ liệu demo trên màn QL CLB: bảng điều khiển (ngày 03/10/2026, phiên S-0023 Galaxy, 12 ngựa, bảng phiên tập, chi phí thú y), Báo cáo tài chính ("Quý 3/2026", ô "Nợ quá hạn" thực ra là tổng nợ chưa trả), Hóa đơn ("tháng 09", "hạn 10/10", "đồng hồ demo 03/10/2026"), Theo dõi y tế ("9,8 tr chi phí thú y tháng này").
15. Trang Đăng ký ngựa (QL CLB) tải chậm 5–8 giây (gọi lịch sử hồ sơ cho từng ngựa); nhật ký hiện "Issue phase invoice" chưa có nhãn tiếng Việt.

---

## 20. Nối thực đơn dinh dưỡng + rà soát code mới (22/10/2026)

Code lúc kiểm tra: BE nhánh `test` `28105c6` · FE nhánh `dev` `6413d01`. Đối chiếu tự động: FE gọi 98 API, **0 API không có trên backend**.

### Backend — đã sửa (chưa commit, cần đẩy lên nhánh `test`)
1. ❌→✅ **Tạo / sửa thực đơn luôn lỗi 500**: DB có ràng buộc `CHK_NPD_meal_type` chỉ nhận `MORNING / NOON / EVENING`, backend lại lưu `AFTERNOON`. Sửa: nhận cả `NOON` và `AFTERNOON`, lưu thành `NOON` (`NutritionPlanDetailCreateDTO`, `NutritionPlanServiceImpl.normalizeMealType`). Không đổi DB.
2. ❌→✅ **Thực đơn đã hủy vẫn hiện là "thực đơn hôm nay"** và vẫn nhận ghi chú khi Bác sĩ duyệt thức ăn đặc biệt: `findActivePlansForHorseOnDate` thêm điều kiện `status = 'ACTIVE'`.
3. ➕ `GET /api/v1/nutrition-plans/feed-items` (HLV, Bác sĩ, Mã phu, QL CLB): danh sách thức ăn / phụ gia uống trong kho để chọn món. Trước đây chỉ Kho đọc được `/inventory/items` nên HLV/Bác sĩ không chọn được món.

### Frontend — đã sửa
| Việc | File |
|---|---|
| **Tính năng mới: Thực đơn dinh dưỡng** — HLV lên/sửa/hủy thực đơn ngựa khỏe; Bác sĩ chỉ định khẩu phần y tế khi ngựa bị khóa; Mã phu xem "Thực đơn hôm nay" (`/horses/{id}/nutrition-plan/today`) kèm ghi chú đặc biệt đã được Bác sĩ duyệt | `src/features/nutrition-plan/`, gắn vào `TrainerHorseRecord/RecordTabs.tsx`, `VetHorseHealth/DietPanel.tsx`, `GroomStable/index.tsx` |
| ❌→✅ Commit `6413d01`: mọi `PATCH /requisitions` không phải ISSUED đều gọi `/supply-requests/{id}/cancel` → Kho mở yêu cầu (tự chuyển "đang kiểm tồn") là bắn nhầm API hủy. Giờ chỉ gọi `confirm-received` khi Mã phu xác nhận đã nhận | `src/api/hybridAdapter.ts` |
| Dọn khối chấm điểm phiên tập (`/training-sessions/{id}/evaluate`) bị lệch ngoặc trong `6413d01` | `src/api/hybridAdapter.ts` |
| Yêu cầu vật tư đã nhận hiện dòng lịch sử "xác nhận đã nhận vật tư" | `src/api/beDomain.ts` |
| Chủ ngựa không gọi `/medical/cases` nữa (trước bị 403 ở "Ngựa của tôi") | `src/api/hybridAdapter.ts` |
| `scenarios:live` nhận vai trò theo tên tài khoản (`*hlv*`, `*bacsi*`…) → chạy được cả 6 vai trò | `scenarios-live/live-support.ts` |

### Kết quả kiểm tra
- Luồng API thực đơn (QA Alpha, ngựa khỏe): **13/13** — HLV lấy danh mục, lên thực đơn, BS bị chặn khi ngựa khỏe, Mã phu xem hôm nay, Mã phu đề nghị thức ăn đặc biệt, BS từ chối < 10 ký tự bị chặn, BS duyệt → ghi vào thực đơn, HLV sửa, HLV hủy → Mã phu không còn thấy.
- Ngựa khóa y tế (QA Gamma): **6/6** — HLV bị chặn, BS lên khẩu phần `MEDICAL`, Mã phu thấy, mở khóa lại.
- Giao diện (5173, backend): HLV sửa thực đơn, Mã phu gửi đề nghị + bấm "Đã nhận" (F5 vẫn giữ), BS duyệt đề nghị — đều lưu thật.
- `npm run check`: lint 0 lỗi, typecheck đạt, **17/17** kịch bản. `npm run scenarios:live`: **12/12** (6 vai trò × API + mọi trang).

### API backend FE vẫn chưa dùng (không ảnh hưởng demo)
`DELETE /nutrition-plans/{id}` (dùng "Hủy" thay vì xóa), `/horses/available-for-training`, `/inventory/low-stock` (FE tự tính từ tồn kho), `PUT /inventory/suppliers/{id}`, `/training-plans/dashboard-stats`, `/billing/owners/{id}/service`, `/owner/training/my-horses`, `/owner/payments/medical-records/{id}/vnpay`, API hồ sơ y tế kiểu cũ (`/veterinary/medical-records`, `/manager/medical-records/{id}/approve`). `/payments/vnpay/ipn|return` do VNPay gọi.
