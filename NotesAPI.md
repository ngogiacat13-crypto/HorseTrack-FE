cd 

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
| Vật tư từ Mã phu: cấp / chờ hàng / từ chối             | `GET /inventory/supply-requests`, `PUT .../{id}/issue                                                  | wait-restock                                    |
| Đơn nhập hàng: tạo, đang giao, đổi ETA, hủy, nhận hàng | `GET/POST /inventory/purchase-orders`, `PUT .../{id}/in-transit                                        | eta                                             |
| Kiểm kê tháng (tạo phiếu + chốt)                       | `GET /inventory/stock-counts`, `GET .../{id}`, `POST /inventory/stock-counts`, `PUT .../{id}/complete` | ✅ đọc · ☑️ ghi                                 |
| Nhật ký kho                                            | `GET /inventory/transactions`                                                                          | ✅                                              |

**Bác sĩ thú y** (`test_bacsi`)

| Màn hình                                                                    | API                                                               |                    |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------ |
| Phác đồ điều trị (danh sách + chi tiết có giai đoạn, phản hồi kho, ghi chú) | `GET /medical-management/protocols`, `GET .../{id}`               | ✅ (PD-0038/39/40) |
| Lập phác đồ / phiên bản mới                                                 | `POST /medical-management/protocols`, `POST .../{id}/new-version` | ☑️                 |
| Xác nhận, chờ hàng, ghi tiến triển, kết thúc, hủy                           | `PUT .../{id}/confirm                                             | wait-restock       |
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
- `GET /training-plans/dashboard-stats`, `GET /inventory/low-stock`, `GET /billing/owners/{id}/service`, `PUT /inventory/suppliers/{id}`: FE đã tự tính từ dữ liệu khác hoặc chưa có màn hình.cd

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

| Luồng               | Đã kiểm tra                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hồ sơ ngựa          | Gửi → duyệt + cấp chuồng / từ chối có lý do → nộp lại → từ chối hẳn. Chặn đúng: checklist chưa đạt, chuồng đã có ngựa, lý do < 10 ký tự, nộp lại khi không được phép          |
| Phân công HLV       | HLV chỉ thấy đúng ngựa được giao; xem ngựa khác → 403; không giao được ngựa bị từ chối                                                                                        |
| Giáo án & phiên tập | Tạo (PENDING) → phân công Mã phu → Mã phu xác nhận → ACTIVE → hoàn thành → HLV chấm 8/10. Chặn đúng: giáo án trùng, Mã phu trùng giờ, hoàn thành khi chưa xác nhận, điểm > 10 |
| Khóa y tế           | Khóa → ngựa INJURED, phiên bị hủy, không xếp/xác nhận được phiên → mở khóa → xếp lại được                                                                                     |
| Ca khám             | Mã phu báo → Bác sĩ khám (MONITORING) → đóng ca; Mã phu báo ngựa ngoài khu → chặn                                                                                             |
| Phác đồ & kho       | Lập → kho kiểm tồn → BS xác nhận → tự lập hóa đơn giai đoạn (BR_16) → kho cấp thuốc → ghi tiến triển                                                                          |
| Vật tư              | Mã phu thấy 12 vật tư thật → gửi / hủy → kho cấp phát                                                                                                                         |
| Việc chăm sóc       | HLV giao → Mã phu hoàn thành; giao cho ngựa không phụ trách → chặn                                                                                                            |
| Tài chính           | Hóa đơn giai đoạn hiện cho chủ ngựa; báo cáo tài chính; đình chỉ khi nợ < 25 ngày → chặn                                                                                      |
| Tài khoản           | Khóa → không đăng nhập được → mở khóa → đăng nhập lại được                                                                                                                    |
| Giao diện           | Trang của HLV, Mã phu, Bác sĩ, Kho, Chủ ngựa, QL CLB đều hiện đúng dữ liệu QA vừa tạo                                                                                         |

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

| Việc                                                                                                                                                                                                                                        | File                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Tính năng mới: Thực đơn dinh dưỡng** — HLV lên/sửa/hủy thực đơn ngựa khỏe; Bác sĩ chỉ định khẩu phần y tế khi ngựa bị khóa; Mã phu xem "Thực đơn hôm nay" (`/horses/{id}/nutrition-plan/today`) kèm ghi chú đặc biệt đã được Bác sĩ duyệt | `src/features/nutrition-plan/`, gắn vào `TrainerHorseRecord/RecordTabs.tsx`, `VetHorseHealth/DietPanel.tsx`, `GroomStable/index.tsx` |
| ❌→✅ Commit `6413d01`: mọi `PATCH /requisitions` không phải ISSUED đều gọi `/supply-requests/{id}/cancel` → Kho mở yêu cầu (tự chuyển "đang kiểm tồn") là bắn nhầm API hủy. Giờ chỉ gọi `confirm-received` khi Mã phu xác nhận đã nhận     | `src/api/hybridAdapter.ts`                                                                                                           |
| Dọn khối chấm điểm phiên tập (`/training-sessions/{id}/evaluate`) bị lệch ngoặc trong `6413d01`                                                                                                                                             | `src/api/hybridAdapter.ts`                                                                                                           |
| Yêu cầu vật tư đã nhận hiện dòng lịch sử "xác nhận đã nhận vật tư"                                                                                                                                                                          | `src/api/beDomain.ts`                                                                                                                |
| Chủ ngựa không gọi `/medical/cases` nữa (trước bị 403 ở "Ngựa của tôi")                                                                                                                                                                     | `src/api/hybridAdapter.ts`                                                                                                           |
| `scenarios:live` nhận vai trò theo tên tài khoản (`*hlv*`, `*bacsi*`…) → chạy được cả 6 vai trò                                                                                                                                             | `scenarios-live/live-support.ts`                                                                                                     |

### Kết quả kiểm tra

- Luồng API thực đơn (QA Alpha, ngựa khỏe): **13/13** — HLV lấy danh mục, lên thực đơn, BS bị chặn khi ngựa khỏe, Mã phu xem hôm nay, Mã phu đề nghị thức ăn đặc biệt, BS từ chối < 10 ký tự bị chặn, BS duyệt → ghi vào thực đơn, HLV sửa, HLV hủy → Mã phu không còn thấy.
- Ngựa khóa y tế (QA Gamma): **6/6** — HLV bị chặn, BS lên khẩu phần `MEDICAL`, Mã phu thấy, mở khóa lại.
- Giao diện (5173, backend): HLV sửa thực đơn, Mã phu gửi đề nghị + bấm "Đã nhận" (F5 vẫn giữ), BS duyệt đề nghị — đều lưu thật.
- `npm run check`: lint 0 lỗi, typecheck đạt, **17/17** kịch bản. `npm run scenarios:live`: **12/12** (6 vai trò × API + mọi trang).

### API backend FE vẫn chưa dùng (không ảnh hưởng demo)

`DELETE /nutrition-plans/{id}` (dùng "Hủy" thay vì xóa), `/horses/available-for-training`, `/inventory/low-stock` (FE tự tính từ tồn kho), `PUT /inventory/suppliers/{id}`, `/training-plans/dashboard-stats`, `/billing/owners/{id}/service`, `/owner/training/my-horses`, `/owner/payments/medical-records/{id}/vnpay`, API hồ sơ y tế kiểu cũ (`/veterinary/medical-records`, `/manager/medical-records/{id}/approve`). `/payments/vnpay/ipn|return` do VNPay gọi.

---

## 21. Kiểm tra code mới BE `59fde20` + FE `340ddcc` (22/10/2026 02:05)

- Không có code trùng đáng kể: 0 API trùng đường dẫn (163 API); `jscpd` BE 1,27% (chủ yếu khối import), FE 0,44%. Logic thực đơn gom ở `ItemCategories.isFeedItem` và `NutritionScope` (BR_03).
- DB chung đã có cột `Daily_Tasks.diet_note`, `is_medical_diet` và trạng thái `SKIPPED`.
- Luồng API thực đơn mới (QA Alpha / QA Gamma): **25/25** — khẩu phần mới thay khẩu phần cũ (`ENDED`), tự tạo việc cho ăn 3 bữa cho Mã phu, BS duyệt đề xuất → ghi lưu ý vào thực đơn và việc cho ăn, Mã phu cho ăn → trừ kho (Cám 120→117, Cỏ 500→498), HLV hủy → việc cho ăn chưa làm chuyển `SKIPPED`, khóa ngựa → khẩu phần thường kết thúc, chỉ BS lập khẩu phần `MEDICAL`, HLV không sửa được, mở khóa → khẩu phần y tế kết thúc.
- ❌→✅ FE (`hybridAdapter.ts`, việc của Mã phu): việc đã hủy `SKIPPED` hiện như "Chờ" (14 việc, trùng lặp) và loại việc mã mới `FEED/CLEAN/...` bị xếp nhầm "Chải lông". Đã ẩn việc `SKIPPED`, nhận loại việc theo mã, hiện lưu ý khẩu phần (`dietNote`).
- `npm run check` 17/17, `npm run scenarios:live` 12/12 (6 vai trò, không 4xx/5xx, không lỗi JS).

---

## 22. Tách dữ liệu thật / dữ liệu mẫu (22/10/2026)

Quy tắc: `npm run dev` → chỉ dùng `db.json`; `npm run dev:be` → chỉ dùng backend, **không bao giờ lấy `db.json`**, chỗ nào chưa có số liệu thật thì ẩn.

### Trước khi sửa — dữ liệu giả lọt vào chế độ backend

| Nguồn                                                      | Hiện ở đâu                                                                                                                                                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db.json` → `dashboard`                                    | Bảng điều khiển: ngày "03/10/2026", banner phiên S-0023 Galaxy, 12 ngựa "+2 tháng này", bảng "Phiên tập hôm nay" (Bolt, Flash, Galaxy…), "Chi phí thú y theo tháng" 42,7 tr; Theo dõi y tế "9,8 tr chi phí tháng này" |
| `db.json` (9 chỗ dự phòng trong `hybridAdapter.ts`)        | Khi backend không trả dữ liệu cho vai trò đó: Mã phu mẫu, tồn kho, yêu cầu vật tư, kiểm kê, hồ sơ đăng ký, hóa đơn, thanh toán, người dùng, nhật ký, nhật ký kho                                                      |
| Backend viết cứng `GET /protocols`, `/protocols/shipments` | "1 lô hàng kho bị trễ · ETA 10/10" (SHIP-0024), phác đồ PD-0013 Comet / PD-0012 Bolt cho HLV, chủ ngựa                                                                                                                |
| Chữ viết cứng trong giao diện                              | "1 thiếu thuốc", "Bông gạc thiếu 12 cuộn · Cần 08/10 · ETA 10/10", "· 1 giai đoạn", "tháng 09", "hạn 10/10", "đồng hồ demo 03/10/2026", "Quý 3/2026", "0 điểm so với Q2", ô "Nợ quá hạn" = tổng nợ chưa trả           |

### Đã sửa

- **FE `hybridAdapter.ts`**: bỏ toàn bộ dự phòng `db.json`; tài nguyên không có backend → 404 (GET) / bỏ qua (ghi); không cộng nhật ký do FE tự tạo vào Nhật ký hệ thống; danh sách Mã phu lấy từ người dùng thật (QL CLB) hoặc chính mình (Mã phu).
- **FE Bảng điều khiển (`managerApi.ts` + `ManagerDashboard/`)**: ngày/thứ/lời chào theo giờ thật; số ngựa = ngựa đã duyệt; "Phiên tập hôm nay" từ chi tiết giáo án; banner phiên bị dừng hôm nay (nếu có); chi phí thú y 6 tháng = tổng tiền phác đồ theo tháng lập; số thiếu thuốc, lô hàng trễ tính từ dữ liệu; ẩn ô chọn kỳ và nút "Xuất báo cáo" (chưa có chức năng).
- **FE Theo dõi y tế / Hóa đơn / Báo cáo tài chính**: chi phí tháng theo phác đồ; "Đã thu" = tất cả kỳ; "hạn sớm nhất" từ hóa đơn chưa trả; "Nợ quá hạn" = các nhóm tuổi nợ đã quá hạn; ẩn nút xuất PDF/Excel giả, ô chọn kỳ, so sánh quý, chú thích "đồng hồ demo".
- **FE khác**: ẩn khung "DEMO" ở Danh mục thuốc, Ngưỡng an toàn phiên tập, nút "Mô phỏng IPN" của chủ ngựa khi chạy backend.
- **BE `ProtocolController.java`**: `GET /protocols` trả phác đồ thật (chủ ngựa chỉ thấy ngựa của mình, HLV chỉ thấy ngựa được giao); `GET /protocols/shipments` trả đơn nhập đang mở phục vụ phác đồ (quá ETA = "Trễ").

### Giữ nguyên (đã là dữ liệu thật)

Nhật ký hệ thống, Đăng ký ngựa, Hóa đơn quá hạn, Công việc trễ SLA, danh sách phác đồ, người dùng.

### Còn là giá trị FE tự điền (không phải `db.json`, backend chưa có)

Giáo án hiển thị 1 giai đoạn mặc định (cường độ "Vừa", 1200 m, 3 buổi/tuần, ngưỡng 180 bpm); ngưỡng phiên tập 180 bpm / 60 km/h (backend không có ngưỡng BR_02); tên chủ ngựa "Chủ ngựa #id" ở màn HLV.

Kiểm tra: `npm run check` 17/17, `npm run scenarios:live` 12/12.

---

## 23. FE chỉ dùng dữ liệu thật trên server + yêu cầu gửi nhóm BE (23/10/2026)

### FE đã sửa

- Đăng nhập / đăng xuất xóa sạch dữ liệu lưu tạm trong tab (`resetBackendData` trong `hybridAdapter.ts`) → mỗi vai trò chỉ thấy dữ liệu thật trên server, giống khi mở trình duyệt khác.
- Thao tác server chưa có API → báo lỗi “Server chưa có API để … — thao tác chưa được lưu” (`notOnServer` trong `beClient.ts`) thay vì giả vờ thành công: tạo / trả lời / gửi BTC / kết quả đề xuất thi đấu, đổi trạng thái sức khỏe, đánh dấu / xóa chấn thương, điều chỉnh giáo án & cho tiếp tục phiên.
- HLV · Lịch tập: bỏ nút “Dừng & gửi bác sĩ”. HLV chỉ dừng phiên / điều chỉnh giáo án ở trang phiên tạm dừng (mở từ “Xử lý ngay” khi có cảnh báo vượt ngưỡng).
- FE hiểu sẵn trạng thái phiên `PAUSED` / `PAUSED_PENDING_TRAINER` từ backend.

### Yêu cầu gửi nhóm BE

**1. Phiên tập: ghi chỉ số, tự tạm dừng khi vượt ngưỡng (F22-02) — ưu tiên cao nhất**
Hiện backend không nhận chỉ số và không kiểm tra ngưỡng, nên HLV không bao giờ nhận được cảnh báo; luồng “Mã phu nhập chỉ số → vượt ngưỡng → HLV xử lý” chỉ chạy được ở dữ liệu mẫu.

- `PUT /training-sessions/{id}/start` (Groom): CONFIRMED → IN_PROGRESS (chặn ngựa đang VetLock, chặn khác ngày).
- `POST /training-sessions/{id}/readings` (Groom) `{ time, heartRate, speedKmh }`: lưu chỉ số; vượt ngưỡng → `PAUSED_PENDING_TRAINER`, chặn nhập tiếp, gửi thông báo cho HLV phụ trách.
- `POST /training-sessions/{id}/recovery` (Groom) `{ time, heartRate }`: nhịp tim hồi phục khi đang tạm dừng.
- `PUT /training-sessions/{id}/resume` (Trainer) `{ intensity, distanceM, maxHeartRate, note }`: chỉ khi `PAUSED_PENDING_TRAINER`, nhịp hồi phục dưới ngưỡng, ngựa không bị khóa → IN_PROGRESS.
- Ngưỡng theo phiên: thêm `maxHeartRate`, `maxSpeedKmh` vào `POST /training-plans/{id}/sessions`.
- Trả về trong `GET /training-plans/{id}` và `GET /training-sessions/my-schedule`: `readings[]`, `recovery[]`, ngưỡng, `pausedAt`, `pausedReason`, `notes`.
- `PUT /training-sessions/{id}/stop`: chỉ cho phép khi phiên đang `PAUSED_PENDING_TRAINER` (HLV chỉ dừng & gửi bác sĩ sau cảnh báo vượt ngưỡng). Hiện đang cho dừng cả PENDING / CONFIRMED / IN_PROGRESS.
- `PUT /training-sessions/{id}/execute`: nối thêm ghi chú (`notes`) thay vì ghi đè, để không mất thông tin đường chạy HLV đặt lúc giao phiên.

**2. Luồng đề xuất thi đấu (hiện chỉ có phần bác sĩ khám `/prerace-exams`)**

- `GET /tournaments`; `POST /race-proposals` (Trainer) `{ horseId, tournamentId, note }` → WAITING_OWNER.
- `GET /race-proposals` (lọc theo quyền: HLV ngựa được giao, chủ ngựa ngựa của mình).
- `PUT /race-proposals/{id}/owner-response` (Horse Owner) `{ agree, note }` → WAITING_VET_EXAM / OWNER_DECLINED.
- `PUT /race-proposals/{id}/submitted`, `PUT /race-proposals/{id}/organizer-rejected { reason }`, `PUT /race-proposals/{id}/result { rank, finishTime, note }` (Trainer).

**3. Hồ sơ sức khỏe**

- `POST /horses/{id}/injuries { part, severity, note, x, y, caseId }`, `DELETE /horses/{id}/injuries/{injuryId}`, trả danh sách chấn thương trong chi tiết ngựa (đã có `InjuryMarkRepository`, chưa có controller).
- `PUT /horses/{id}/health-status { status, reason }` (Veterinarian).

**4. Chăm sóc & chuồng**

- HLV giao việc chăm sóc: `POST /care-tasks` đã có nhưng cần `groomId`; thêm API cho HLV lấy Mã phu theo khu của ngựa, ví dụ `GET /horses/{id}/grooms`.
- Trạng thái dọn chuồng: tự đặt CLEAN khi hoàn thành việc dọn chuồng, hoặc `PUT /stalls/{id}/clean-status`.

**5. Tài khoản**: `PUT /account/my-profile` (sửa thông tin), `POST /account/avatar` (ảnh đại diện).

**6. Dữ liệu trả về**: `GET /horses` thêm `ownerName` (màn HLV đang hiện “Chủ ngựa #id”); cột `action_type` nhật ký hệ thống bị cắt (“CREATE_NUTRITION_PLA”) — tăng độ dài cột.

**7. Cấu hình server** (`deploy.yml` → `docker run -e …`, giá trị đặt trong GitHub Secrets): `MAIL_USERNAME`, `MAIL_PASSWORD` (OTP quên/đổi mật khẩu đang chỉ in ra log), `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`, `VNPAY_FRONTEND_RESULT_URL`, `CORS_ALLOWED_ORIGINS`.

Kiểm tra: `npm run check` 17/17, `scenarios:live` (admin, gọi server `103.245.237.252:8080`) 2/2.

## 24. Kéo BE `deploy@8c48731` + nối API mới (24/10/2026)

BE `2fb11e9` (đã chạy trên server, schema `DATABASE_fe_requests_schema.sql` đã có trong DB) giải quyết phần lớn danh sách §23. FE đã nối, chạy với dữ liệu thật:

| Chức năng                                                           | API                                                                                                                                | FE                                                                                           |
| :------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| Mã phu bắt đầu phiên                                                | `PUT /training-sessions/{id}/start`                                                                                                | `groomApi/sessionsApi.ts · start`                                                            |
| Mã phu nhập chỉ số (server tự so ngưỡng → `PAUSED_PENDING_TRAINER`) | `POST /training-sessions/{id}/readings` `{time, heartRate, speedKmh}`                                                              | `groomApi/sessionsApi.ts · addReading`                                                       |
| Mã phu đo nhịp hồi phục                                             | `POST /training-sessions/{id}/recovery` `{time, heartRate}`                                                                        | `groomApi/sessionsApi.ts · addRecovery`                                                      |
| HLV điều chỉnh & cho tập tiếp                                       | `PUT /training-sessions/{id}/resume` `{intensity, distanceM, maxHeartRate, note}`                                                  | `trainerApi/sessionsApi.ts · adjustAndContinue`                                              |
| Chỉ số, ngưỡng, giờ tạm dừng của phiên                              | `readings`, `recovery`, `maxHeartRate`, `maxSpeedKmh`, `pausedAt`, `pausedReason` trong `GET /training-plans/{id}`, `/my-schedule` | `hybridAdapter.ts · monitor()` (bỏ ngưỡng cứng 180/60)                                       |
| Giải đấu                                                            | `GET /tournaments`                                                                                                                 | `hybridAdapter.ts · LOADERS.tournaments`                                                     |
| Đề xuất thi đấu                                                     | `GET/POST /race-proposals`, `PUT /{id}/owner-response`, `/submitted`, `/organizer-rejected`, `/result`                             | `hybridAdapter.ts · LOADERS.raceProposals`, `trainerApi/racesApi.ts`, `ownerApi/racesApi.ts` |
| Chấn thương                                                         | `GET/POST /horses/{id}/injuries`, `DELETE /horses/{id}/injuries/{injuryId}`                                                        | `hybridAdapter.ts · injuriesOf` (GET `/horses/:id`), `vetApi/healthApi.ts`                   |
| Trạng thái sức khỏe                                                 | `PUT /horses/{id}/health-status` `{status, reason}`                                                                                | `vetApi/healthApi.ts · setHealthStatus`                                                      |
| Trạng thái dọn chuồng                                               | `PUT /stalls/{id}/clean-status` `{status}`                                                                                         | `hybridAdapter.ts · WRITES.stalls`                                                           |
| Ảnh đại diện                                                        | `POST /account/avatar` (multipart `file`, ≤ 1 MB)                                                                                  | `authApi.ts · updateAvatar`                                                                  |
| Tên chủ ngựa                                                        | `ownerName` trong `GET /horses`                                                                                                    | `hybridAdapter.ts · LOADERS.horses`                                                          |

Bỏ ở FE: map nút “Dừng” → `execute CANCELLED` (làm giáo án kẹt `PAUSED`); Mã phu báo sự cố không còn giả lập tạm dừng phiên trong tab khi chạy backend.

**Còn gửi BE** (chi tiết `../QA_Audit_HorseTrack.md`):

1. Hủy 1 phiên vẫn chuyển giáo án `PAUSED`, không có API hủy/tiếp tục giáo án → ngựa không lập được giáo án mới. Cần `PUT /training-plans/{id}/cancel`, `/resume`; hủy phiên không pause giáo án.
2. `PUT /execute`, `/evaluate`: HLV bất kỳ thao tác được phiên ngựa không phụ trách — thêm `horseAccessGuard.checkAssigned`.
3. `POST /medical/vet-lock` cho cả Groom/Trainer — chỉ nên Veterinarian.
4. Không có `@Version` (ghi đè khi thao tác đồng thời); thiếu ràng buộc unique “1 giáo án mở / ngựa”.
5. `application.properties` còn giá trị mặc định cho mật khẩu DB và `jwt.secret`.
6. Mã phu báo sự cố khi đang tập: chưa có API tạm dừng phiên đang chạy (`PAUSED_PENDING_TRAINER`) theo sự cố.
7. Chưa có màn/API FE cho Quản lý CLB tạo giải (`POST /tournaments` đã có ở BE — FE cần làm màn mới).
8. Lỗi trạng thái trả 400/500 thay vì 409/404; VNPay tạo nhiều giao dịch PENDING cho cùng hóa đơn.

Kiểm tra: `npm run typecheck`, `npm run lint` 0 lỗi, `npm run scenarios` 17/17, `scenarios:live` (admin, server thật, thêm `/tournaments`, `/race-proposals`, `/horses/{id}/injuries`) 2/2.

## 25. Nhật ký review Assignment 2 — phần FE (24/10/2026)

BE `deploy` không có commit mới (`8c48731`). Đã làm ở FE: validate chung `PHONE_RE`/`EMAIL_RE` (`components/ui/Ht/password.ts`) cho đăng ký chủ ngựa và tạo nhân viên (SĐT nhân viên bắt buộc); họ tên chủ ngựa không bắt buộc (trống → gửi tên đăng nhập); hồ sơ ngựa: gợi ý + validate giống (`ownerApi/labels.ts · HORSE_BREEDS`), chiều cao hands 12–20, cân nặng 100–1200 kg, bỏ hộ chiếu/GCN dạng chữ, SĐT lấy từ tài khoản, kiểm tra nội dung tệp (`DocUpload.tsx`); màn duyệt bỏ “Hộ chiếu”, “GCN sức khỏe”, “Ngựa đang gửi”; hồ sơ cá nhân hiện mã chứng chỉ/chuyên môn/kinh nghiệm. Kịch bản mới `scenarios/registration-validation.spec.ts`.

Việc cần BE (OTP xác thực email khi đăng ký, đăng nhập bằng email/SĐT, lưu & xem giấy tờ + kiểm tra AI, xác thực nhân viên + trạng thái mail/đăng nhập, phân công chờ xác nhận, nhật ký email, sửa hồ sơ nhân viên): xem `../YeuCau_BE_Review_Assignment2.md`.

Kiểm tra: `npm run check` 19/19, `scenarios:live` (admin, server thật) 2/2.

## 26. Rà soát “còn chạy dữ liệu giả” khi dùng server (24/10/2026)

- FE không còn chỗ nào đọc `db.json` khi `npm run dev:be` (`http.ts` dùng `hybridAdapter`; chỉ import hằng `ROLE_HOME`).
- **Dữ liệu giả từ server**: `GET /vaccinations` của BE viết cứng “Bolt/Arrow” → FE chỉ giữ mũi tiêm của ngựa có thật, chặn tạo lịch/ghi nhận (`notOnServer`), màn Tiêm phòng có cảnh báo `vaccination-backend-missing`.
- **Giá trị FE tự điền**: giáo án hết hiện “Thể lực · Vừa · 1200 m”; loại + mục tiêu đọc từ `goal` thật (`planMeta`), giai đoạn đánh dấu `estimated` → hiện “Server chưa lưu cường độ / cự ly giai đoạn” và “≤ 180 bpm (ngưỡng mặc định server)”.
- **Lưu tạm trong tab (overlay)**: bỏ hẳn — ghi không có API trên server không còn giả lập thành công, chỉ `console.warn`, màn hình luôn hiện dữ liệu server. Các WRITES gọi API thật đều trả `true` (horses lock, tasks, trainingSessions COMPLETED).
- Sửa lỗi: Mã phu hoàn thành việc trễ SLA báo lỗi 404 `/dashboard` sau khi đã lưu.
- Màn Người dùng bỏ thông báo sai “dữ liệu mẫu (db.json)”.
- Gửi BE: `../YeuCau_BE_Review_Assignment2.md` mục H (tiêm phòng giả, giáo án không lưu giai đoạn, API VNPay bệnh án giả lập).

Kiểm tra: `npm run check` 19/19, `scenarios:live` (admin) 2/2.

## 27. Nối API hủy / chạy lại giáo án (24/10/2026)

Server đã chạy BE `6baa01f` (164 API). FE nối `PUT /training-plans/{id}/cancel` `{reason 5–500 ký tự}` và `PUT /training-plans/{id}/resume` (`trainerApi/plansApi.ts · cancelPlan, resumePlan`), nút “Hủy” / “Chạy lại” ở màn Giáo án HLV (`TrainerPlans/PlanActionDialogs.tsx`). Kiểm tra trên server thật bằng lời gọi không đổi dữ liệu: resume giáo án PENDING → 400 “Chỉ cho chạy lại giáo án đang tạm dừng”, cancel lý do ngắn → 400. Kịch bản `scenarios/plan-cancel-resume.spec.ts`.

## 28. Thêm vật tư / thuốc vào phác đồ (24/10/2026)

Nút “Sửa phác đồ (phiên bản mới)” thay bằng “Thêm vật tư / thuốc” (`VetProtocolDetail/AddItemsDialog.tsx`), hiện ở mọi trạng thái BE cho tạo phiên bản (`REVISABLE_STATES`: chờ kiểm tồn, thiếu/đủ hàng, chờ hàng, cần đánh giá lại, BS đã xác nhận, tạm dừng chờ thanh toán) — không hiện khi đang điều trị/đã đóng. Luồng: giữ nguyên thuốc cũ + cộng thuốc mới vào giai đoạn chọn (`vetApi/labels.ts · withAddedItems`, thuốc trùng thì cộng số lượng vì BE không nhận thuốc lặp trong 1 giai đoạn) → `POST /medical-management/protocols/{id}/new-version` (bản cũ SUPERSEDED, trả hàng đã giữ, bản mới gửi kho kiểm tồn) → chuyển sang trang phiên bản mới. Ngày cần thuốc đã qua thì dùng hôm nay (BE `@FutureOrPresent`). BE chưa có API thêm thuốc vào chính phác đồ đang chạy (không tạo phiên bản) — nếu cần thêm thuốc khi **đang điều trị** phải nhờ BE làm.

## 29. Bác sĩ hủy phác đồ + kho thấy bản cũ / bản mới (24/10/2026)

- Bác sĩ: nút “Hủy phác đồ” (`cancel-protocol-btn`) ở mọi trạng thái chưa cấp thuốc, kể cả đang chờ kho kiểm tồn; bắt buộc lý do ≥ 10 ký tự → `PUT /medical-management/protocols/{id}/cancel` `{content: lý do}` (trước đây FE luôn gửi “Hủy phác đồ”). BE trả hàng đã giữ, lưu lý do vào note “Hủy: …”.
- Kho: `loadProtocols` lấy thêm `GET /inventory/protocols?state=SUPERSEDED` và `?state=CANCELLED`; màn Phác đồ cần cấp có tab “Bác sĩ đã đổi / hủy” (ghi “Đã thay bằng PD-x” / “Bác sĩ hủy: lý do”), cột mã ghi `vN · thay PD-y`; trang chi tiết có bảng “Thay đổi so với PD-y” (thêm / bỏ / đổi số lượng — `vetApi/labels.ts · protocolChanges`) và cảnh báo không cấp phát với bản đã thay / đã hủy.
- Kịch bản `scenarios/protocol-add-items.spec.ts` (4 trường hợp).

## 30. Đăng ký OTP email, đăng nhập email/SĐT, giấy tờ hồ sơ ngựa (24/10/2026)

BE `4125816` (đã chạy trên server, 167 API).

- Đăng ký chủ ngựa 2 bước: `POST /auth/register-owner` không `otp` → BE kiểm tra trùng + tên miền email (không nhận thư thì 400 ngay), gửi OTP, trả `{otpRequired, email (che), ttlSeconds}`; gửi lại cùng thông tin kèm `otp` → 201 tạo tài khoản. FE: `authApi.register(payload, otp?)`, bước nhập OTP `pages/auth/Register/OtpStep.tsx` (gửi lại sau 60s, quay lại sửa thông tin). Dữ liệu mẫu: OTP demo 123456.
- Đăng nhập: ô “Tên đăng nhập / Email / Số điện thoại” (BE `findByLoginId`). Đã thử đăng nhập admin bằng email trên server → 200.
- Hồ sơ ngựa: gửi `heightCm`; sau `POST /horses/register` (trả `horseId`) hoặc `PUT /resubmit`, FE tải từng tệp `POST /horses/{id}/registration-attachments` multipart `file`, `docType` = `OWNERSHIP` (giấy sở hữu) / `OTHER` (GCN sức khỏe). QL CLB thấy tệp từ `attachments` của lịch sử hồ sơ, nút “Xem” tải `GET /horses/registration-attachments/{id}/file` (blob, kèm token) và mở tab mới. `ownerPhone`, `heightCm` từ `GET /horses` thay cho `heightHands`/`passportNo`/`healthCert*` BE đã bỏ.
- Kiểm tra server không tạo dữ liệu: bước 1 với tên miền giả → 400 “không nhận thư”, trùng username → 400.

## 31. Kho không thấy phác đồ chờ cấp phát / đã cấp phát (24/10/2026)

- Nguyên nhân 1: BE đặt `VET_CONFIRMED` sau khi bác sĩ xác nhận, FE kho chờ `READY_FOR_DISPENSING` → phác đồ đã xác nhận không ở tab nào, không có form cấp phát. Sửa `beDomain.ts · mapProtocol`: `VET_CONFIRMED` → `READY_FOR_DISPENSING` (Chờ kho cấp phát). Trên server lúc sửa: PD-1020, 1023, 1027, 1028.
- Nguyên nhân 2: `GET /inventory/protocols` mặc định chỉ trả WAITING_STOCK_CHECK, WAITING_RESTOCK, REQUIRES_VET_REVIEW, VET_CONFIRMED. FE kho lấy thêm `?state=` STOCK_AVAILABLE, STOCK_SHORTAGE, IN_TREATMENT, ON_HOLD_PAYMENT, COMPLETED, SUPERSEDED, CANCELLED. Tab “Đã cấp phát” gồm đang điều trị / tạm dừng chờ thanh toán / hoàn tất; dòng thuốc `status = ISSUED` hiện “Đã cấp”.
- Gửi BE (không bắt buộc): trả thời điểm và người cấp phát trong `stockAnswer` (`issuedAt`, `issuedByName`) để kho có lịch sử cấp phát đầy đủ; cân nhắc thêm các trạng thái trên vào danh sách mặc định của `/inventory/protocols`.

## 32. Đối chiếu toàn bộ API với Swagger server (28/10/2026)

Swagger server (BE `9fca439`) có 181 API (đã gộp bản `/api/...` trùng với `/api/v1/...`). Code FE nhánh dev (`153a020`) gọi 159 (map 189 dòng vì một API có thể dùng ở nhiều vai trò). 22 API không gọi:

- Chưa có màn hình trong đặc tả: `POST /tournaments`, `PUT /horses/{id}`.
- FE dùng cách khác: `DELETE /nutrition-plans/{planId}` (dùng `/cancel`), `PUT /inventory/stock-counts/{id}` (tạo rồi chốt ngay), `PUT …/phases/{phaseNo}/finish-early` (dùng `…/complete`), `GET /audit-logs` (dùng `/paged`), `GET /auth/confirm-account` (FE gọi `POST`).
- Xem chi tiết theo id, FE lấy từ API danh sách: race-proposals, purchase-orders, diet-requests, billing/invoices, nutrition-plans, horses, users, users/{id}/barn-zone; cùng `GET /users`, `GET /horses/{id}/registration-attachments`.
- API cũ hoặc do VNPay gọi: `POST /veterinary/medical-records`, `PUT /manager/medical-records/{id}/approve`, `POST /owner/payments/medical-records/{id}/vnpay`, `GET /payments/vnpay/return`, `GET /payments/vnpay/ipn`.

Có trong code nhưng giao diện chưa có nút gọi: `authApi.updateAvatar` (`POST /account/avatar`, nút bị bỏ ở `153a020`) và `managerApi.changeRole` (`PUT /users/{id}/role`).

## 33. Dừng buổi tập kết thúc ngay (BE `2bca05b`, 28/10/2026)

- `PUT /training-sessions/{id}/stop` giờ trả buổi `STOPPED` (không còn `WAITING_VET`), giáo án không tạm dừng. FE bỏ trạng thái “Chờ bác sĩ” của buổi tập; dữ liệu cũ `WAITING_VET` hiện là “Đã dừng”.
- `PUT /training-sessions/{id}/evaluate` nhận cả `COMPLETED` và `STOPPED`: Lịch tập và trang chi tiết phiên có nút “Đánh giá” cho buổi đã dừng. Buổi `CANCELLED` (bác sĩ khóa huấn luyện) không có nút vì BE từ chối.
- Khi ca khám từ buổi bị dừng còn mở, BE chặn Mã phu bắt đầu buổi mới của ngựa; FE hiện nguyên thông báo lỗi của BE.

## 34. Nối nhóm API xem chi tiết theo id (28/10/2026)

FE gọi thêm 10 API, nâng số API dùng lên 169/181. Khi mở trang chi tiết, `hybridAdapter.ts · DETAILS` gọi API chi tiết để làm mới bản ghi lấy từ danh sách; API lỗi thì giữ bản ghi cũ. Mỗi API chỉ gọi khi vai trò được BE cho phép.

- `GET /horses/{id}` (mọi vai trò trừ Kho), `GET /race-proposals/{id}` (HLV, Chủ ngựa), `GET /horses/{horseId}/registration-attachments` (QL CLB, Chủ ngựa), `GET /inventory/purchase-orders/{orderId}` (Kho).
- QL CLB: `GET /users` (danh sách phân trang, size 500; thiếu thì quay về `/users/all`); `GET /users/{id}` kiểm tra trạng thái trước khi khóa / mở khóa; `GET /users/{id}/barn-zone` đọc khu hiện tại trước khi đổi khu Mã phu; `GET /billing/invoices/{invoiceId}` kiểm tra trước khi hủy hóa đơn (đã thanh toán / đã hủy / có giao dịch thì chặn).
- Bác sĩ: `GET /diet-requests/{requestId}` kiểm tra đề xuất còn `PENDING` trước khi duyệt / từ chối.
- HLV, Bác sĩ: `GET /nutrition-plans/{planId}` kiểm tra thực đơn còn `ACTIVE` trước khi sửa.

Còn 12 API không gọi: `POST /tournaments`, `PUT /horses/{id}`, `DELETE /nutrition-plans/{planId}`, `PUT /inventory/stock-counts/{id}`, `PUT …/finish-early`, `GET /auth/confirm-account`, `GET /audit-logs`, và 5 API cũ / do VNPay gọi (xem §32).

## 35. BE `5aec6cb`: việc chăm sóc đã giao, ngày bắt đầu khẩu phần (28/10/2026)

- `GET /care-tasks/assigned?date=&status=` (HLV: ngựa mình phụ trách; QL CLB: mọi ngựa): bảng “Việc chăm sóc đã giao” (`features/care-task-assign/AssignedCareTasks.tsx`) ở tab “Việc chăm sóc” trong hồ sơ ngựa của HLV (lọc theo ngựa, tự tải lại sau khi giao việc) và ở bảng điều khiển QL CLB. Lọc theo ngày và trạng thái, hiện giờ hoàn thành.
- Giao việc chăm sóc: bỏ loại “Cho ăn” (việc cho ăn sinh từ thực đơn dinh dưỡng) và “Cho thuốc” (thuốc đi theo phác đồ). Việc cũ loại này vẫn hiện đúng nhãn.
- Khẩu phần: BE chặn ngày bắt đầu ở quá khứ. FE chặn trước: tạo mới thì ô ngày nhỏ nhất là hôm nay; sửa thực đơn đang chạy thì giữ được ngày bắt đầu cũ, đổi ngày thì không được lùi về quá khứ.
- BE gửi email cho HLV khi Mã phu hoàn thành việc (trừ việc cho ăn tự sinh) và server chạy giờ Việt Nam — FE không cần đổi.

Swagger server giờ có 182 API; FE gọi 170.

## 36. BE `6591e02`: việc theo ngày, phút trễ, thống kê trễ trong ngày (29/10/2026)

- `GET /care-tasks/my-tasks?date=yyyy-MM-dd`: trang “Công việc hôm nay” của Mã phu có ô chọn ngày (nút “Hôm nay” để quay lại). Ngày khác hôm nay thì `hybridAdapter` gọi thẳng `my-tasks?date=` (không dùng bộ nhớ đệm của hôm nay).
- BE chặn hoàn thành việc của ngày sau: FE hiện nhãn “NGÀY SAU”, ẩn ô hoàn thành, báo “chỉ xem trước”; `groomApi.completeTask` cũng chặn trước khi gọi API.
- `lateMinutes` (phút trễ so với giờ hẹn khi quá SLA): thẻ việc của Mã phu tính “trễ X phút SLA” từ trường này; bảng việc trễ và bảng “Việc chăm sóc đã giao” của QL CLB / HLV hiện “Trễ X phút”.
- `GET /care-tasks/overdue?scope=today`: thẻ “Việc trễ SLA” trên trang chủ QL CLB hiện số việc trễ trong ngày (kể cả đã hoàn thành trễ) ở dòng “+N hôm nay”; danh sách vẫn là việc trễ đang mở.
- Lập / sửa khẩu phần giờ gửi việc cho ăn cả hôm nay và ngày mai — Mã phu xem trước bằng ô chọn ngày.

## 37. BE `ccb73e8` + `464963d`: khung giờ xác nhận hoàn thành việc (29/10/2026)

- `CareTaskDTO` thêm `canComplete` và `completableFrom` (giờ hẹn − `CARE_EARLY_COMPLETE_MINUTES`, mặc định 30 phút). BE chặn `PUT /care-tasks/{id}/complete` trước thời điểm này, kể cả việc hôm nay.
- FE: `groomApi.completeWindow` dùng `canComplete` / `completableFrom` của BE (dữ liệu mẫu tự tính giờ hẹn − 30 phút). Thẻ việc chưa tới giờ ẩn ô hoàn thành và ghi “Chưa tới giờ · xác nhận hoàn thành được từ HH:mm”; `completeTask` chặn trước khi gọi API.
- `464963d` chỉ thêm chẩn đoán lỗi chữ ký VNPay ở BE và tài liệu `API_BY_ROLE.md` — FE không cần sửa. File `DATABASE_delete_all_horses.sql` xóa toàn bộ ngựa: không chạy trên dữ liệu thật.

## 38. Đếm lại API và nối 2 API mới (30/10/2026)

- Swagger server ghi 220 dòng nhưng chỉ có 191 API: 29 API khai báo cả `/api/...` và `/api/v1/...`. Bản đồ API (bản 12) có 217 dòng vai trò × API = 179 API khác nhau.
- FE gọi 179/191. Nối thêm: `GET /vaccinations/items?kind=VACCINE|DEWORM` (hộp lên lịch tiêm phòng / tẩy giun lấy đúng danh mục kèm tồn khả dụng; dữ liệu mẫu vẫn lọc danh mục cũ) và `GET /inventory/stock-counts/{countId}` (Kho mở biên bản kiểm kê thì tải chi tiết qua `hybridAdapter · DETAILS.stockChecks`).
- 12 API không gọi: 5 API cũ / do VNPay gọi; 5 thao tác FE làm bằng API khác (xóa thực đơn → `/cancel`, sửa phiếu kiểm kê nháp, kết thúc sớm giai đoạn → `/complete`, `GET /audit-logs` → `/paged`, `GET /auth/confirm-account` → `POST`); 2 màn hình không có trong đặc tả (`POST /tournaments`, `PUT /horses/{id}`).
- Sửa bản đồ: dòng cũ `GET /inventory/stock-counts/{id}` thực ra là API danh sách, đã bỏ vì trùng dòng `GET /inventory/stock-counts`.

## 39. Trạng thái giai đoạn phác đồ lấy từ BE (`phaseProgress`, BE `40b15bf`, 30/10/2026)

- `TreatmentProtocolDTO.phaseProgress[]`: `phaseNo`, `status` (`WAITING_PAYMENT` | `READY_TO_START` | `IN_PROGRESS` | `COMPLETED` | `STOPPED`), `canStart`, `canFinish`, `finishBlockedReason`. FE đọc trong `beDomain.ts · mapProtocol`; `phaseProgressOf` dùng trạng thái này cho mọi giai đoạn thay vì tự suy từ ghi chú tiến triển.
- `DecisionPanel`: “Bắt đầu giai đoạn N” theo `canStart`; “Hoàn thành GĐ N” và “Kết thúc GĐ N và bắt đầu GĐ N+1” khóa khi `canFinish = false`, hiện `finishBlockedReason` (`protocol-phase-finish-blocked`); nút bắt đầu ngay GĐ sau chỉ hiện khi GĐ sau là `READY_TO_START`. Dữ liệu mẫu không có các cờ này thì FE vẫn tự tính như cũ.

## 40. Luồng đăng ký giải đấu mới (FE xong bằng dữ liệu mẫu, chờ BE — 30/10/2026)

- Thư mục `src/features/tournament-registration/`. Dữ liệu mẫu: `db.json · raceTournaments`, `raceEntries`, thêm `weightKg` cho ngựa (khóa bộ nhớ mock lên `v18`).
- Cờ bật: dữ liệu mẫu luôn chạy luồng mới; chạy backend thì chỉ bật khi `VITE_RACE_FLOW=v2` (đặt trên Vercel sau khi BE triển khai xong). Chưa bật thì giữ màn hình cũ (`/trainer/races`, `/owner/races`, khám trước thi đấu cũ).
- Màn hình: Quản lý CLB `/manager/tournaments`, `/manager/tournaments/:id` (suất đang giữ, hàng chờ, nhập kết quả), `/manager/race-complaints`; Chủ ngựa `/owner/tournaments`, `/owner/race-entries`; HLV `/trainer/race-confirmations`; Bác sĩ `/vet/race-exams` (cột hạn khám, xếp theo hạn gần nhất). Giáo án: chặn cường độ “Cao” trong 7 ngày trước ngày thi của ngựa đang giữ suất.
- Quy tắc FE kiểm tra (BE phải kiểm tra lại y hệt): mỗi chủ ngựa 1 đề xuất còn hiệu lực / giải; ai đề xuất trước giữ suất trước, hết suất vào hàng chờ; hạn HLV 2 ngày, bác sĩ 3 ngày, lệ phí 2 ngày, không hạn nào quá hạn đăng ký; mất suất thì người đầu hàng chờ lên `WAITING_TRAINER`; đề xuất lại xếp cuối hàng; hết hạn đăng ký thì hàng chờ thành `NO_SLOT`.
- API FE gọi khi bật `v2` (hợp đồng đã chốt):
  - `GET /tournaments`, `GET /tournaments/{id}`, `POST /tournaments`, `PUT /tournaments/{id}`, `PUT /tournaments/{id}/publish`, `PUT /tournaments/{id}/results` body `[{ proposalId, rank, finishTime }]`.
  - `GET /owner/tournaments` → `[{ tournament, eligible, horses: [{ horseId, horseName, eligible, reasons[], formScore }], myProposal, slotsLeft, queueLength }]`.
  - `GET /race-proposals` (lọc `tournamentId`, `horseId`, `hasComplaint`), `POST /race-proposals` `{ tournamentId, horseId }`, `PUT /race-proposals/{id}/cancel`, `PUT /race-proposals/{id}/trainer-decision` `{ approve, reasonCode, note }`, `POST /race-proposals/{id}/complaint` `{ reason }`, `PUT /race-proposals/{id}/complaint-decision` `{ accept, note }`, `GET /race-proposals/{id}/dossier`.
  - Khám: dùng lại `POST /prerace-exams/{proposalCode}/examine` `{ isPassed, vetNotes }`; ĐẠT thì BE tự tạo hóa đơn lệ phí (`invoiceId` trên đề xuất), thanh toán qua VNPay hiện có; trả xong thì đề xuất thành `REGISTERED`.
- Trường FE đọc trên `TournamentDTO`: `tournamentId, name, organizer, location, raceDate, registrationDeadline, distanceM, entryFee, slots, minAgeYears, maxAgeYears, minWeightKg, maxWeightKg, allowedBreeds[], prizes[{rank, amount}], status (DRAFT|PUBLISHED|FINISHED), note`.
- Trường FE đọc trên `RaceProposalDTO`: `proposalId, proposalCode, tournamentId, horseId, horseName, ownerName, status, createdAt, stageDeadline, queuePosition, trainerDecision{approve, reasonCode, note, by, at}, vetPassed, vetNote, vetName, vetCheckedAt, invoiceId, complaint{reason, at, status, decidedBy, decidedAt, decisionNote}, rank, finishTime, prizeAmount, history[{at, who, text, tone}]`.
- `reasonCode`: `NOT_READY`, `HEALTH_RISK`, `SCHEDULE_CONFLICT`, `DISTANCE_MISMATCH`, `OTHER`. Trạng thái: `WAITLISTED`, `WAITING_TRAINER`, `WAITING_VET_EXAM`, `WAITING_PAYMENT`, `REGISTERED`, `RESULTED`, `TRAINER_REJECTED`, `TRAINER_EXPIRED`, `VET_FAILED`, `VET_EXPIRED`, `PAYMENT_EXPIRED`, `OWNER_CANCELLED`, `NO_SLOT`.
- Đã khớp BE `ce38eea` (nhánh `deploy`, 30/10/2026): cờ đổi thành mặc định BẬT (`VITE_RACE_FLOW=v1` mới quay về màn hình cũ, vì BE đã bỏ API cũ `owner-response`, `submitted`, `organizer-rejected`, `result`). Trạng thái theo BE: `RESULT_RECORDED`, `CANCELLED`, thêm `INELIGIBLE`. Mã lý do HLV theo BE: `NOT_FIT`, `INJURY_RISK`, `POOR_FORM`, `TRAINING_PLAN`, `DISTANCE_MISMATCH`, `OTHER`. Đề xuất đọc các trường phẳng của BE (`tournament{}`, `proposedAt`, `trainerApproved/ReasonCode/Note/DecidedAt/Name`, `complaintStatus PENDING|ACCEPTED|REJECTED`, `complaintNote`, `invoiceCode`, `finishTimeSeconds`, `prizeAmount`, `canComplain`); diễn biến FE tự dựng từ các mốc thời gian. Khiếu nại gửi `{ note }`. Hồ sơ đọc `RaceDossierDTO`. Chủ ngựa dùng `canPropose`, `cannotProposeReason`, `recommended`, `formScore` (có thể `null`), `formNote`. Chặn cường độ Cao chỉ tính đề xuất đã được HLV xác nhận (`WAITING_VET_EXAM`, `WAITING_PAYMENT`, `REGISTERED`) như `RaceTrainingGuard`.
- Kiểm tra server 30/10/2026: `GET /tournaments`, `GET /race-proposals` trả 500 `Invalid column name 'allowed_breeds'` — DB server chưa chạy `DATABASE_tournament_flow5.sql`. `GET /race-proposals/reject-reasons` 200. Các tài khoản `qa_*_16010` đăng nhập 401.
- 31/10/2026: BE đã chạy `DATABASE_tournament_flow5.sql` và thêm `a6aae26` (lỗi 500 chỉ trả mã lỗi, không lộ SQL; trùng đề xuất trả 409). Quản lý CLB: `/tournaments`, `/race-proposals`, `?complaintStatus=PENDING`, `/reject-reasons` đều 200; trang `/manager/tournaments`, `/manager/race-complaints` qua `scenarios:live`. Chưa kiểm được HLV / bác sĩ / chủ ngựa vì tài khoản `qa_*_16010` đăng nhập 401.
- Cần BE: job quét hạn (mất suất + đôn hàng chờ); thông báo `/notifications` có `link` tới `/owner/race-entries`, `/trainer/race-confirmations`, `/vet/race-exams`, `/manager/race-complaints`; HLV chỉ thấy đề xuất của ngựa mình phụ trách. Dữ liệu mẫu kiểm tra hạn mỗi lần tải trang.
