# Bản đồ tính năng (feature-map)

Tra cứu nhanh: màn hình nằm ở đâu, mở bằng cách nào, bám vào thẻ `data-testid` nào khi viết kịch bản kiểm thử.
**Cập nhật file này trong mọi PR thêm/sửa màn hình hoặc `data-testid`.**

- Gọi API: `src/api/<vai-trò>Api/` (dữ liệu mẫu) · `src/api/hybridAdapter.ts`, `beDomain.ts`, `beActions.ts` (backend thật, xem `NotesAPI.md`).
- Route: `src/routers/routerPath.ts` · Menu theo vai trò: `src/components/layout/nav.ts`.
- Tính năng MỚI viết theo `src/features/<tên-tính-năng>/` (xem `AGENTS.md`) và thêm dòng vào bảng dưới.

Quy ước `data-testid`: menu trái `nav-<đường dẫn bỏ / đầu, / đổi thành ->` (vd `/manager/audit-logs` → `nav-manager-audit-logs`); ô nhập Formik tự có `<name>-input`; tiêu đề trang `page-title`; nút quay lại `back-btn`.

| Tên màn hình / Tính năng | Đường dẫn mã nguồn | Phím tắt / Trigger | Thẻ DOM chính (`data-testid`) |
| :--- | :--- | :--- | :--- |
| Trang chủ / chuyển hướng | `src/routers/index.tsx` | `/` → `/login` hoặc trang chủ theo vai trò | — |
| Giới thiệu | `src/pages/public/Landing/` | `/gioi-thieu` | — |
| Đăng nhập | `src/pages/auth/Login/` | `/login` (mặc định khi chưa đăng nhập) | `login-form`, `username-input`, `password-input`, `login-submit`, `login-error` |
| Đăng ký chủ ngựa | `src/pages/auth/Register/` | `/register` | `<tên-trường>-input` |
| Quên mật khẩu (OTP) | `src/pages/auth/ForgotPassword/` | `/forgot-password` | `<tên-trường>-input` |
| Đổi mật khẩu (OTP) | `src/pages/auth/ChangePassword/` | `/change-password` · menu tài khoản | `nav-change-password`, `menu-change-password`, `oldPassword-input`, `newPassword-input`, `confirmPassword-input`, `otp-input` |
| Hồ sơ cá nhân | `src/pages/auth/MyProfile/` | `/my-profile` · menu tài khoản | `nav-my-profile`, `menu-my-profile` |
| Hồ sơ ngựa (dùng chung) | `src/pages/shared/HorseProfile/` | `/horses/:id` | `page-title`, `back-btn` |
| Khung ứng dụng: menu trái, thanh trên | `src/components/layout/` | Sau khi đăng nhập | `sidebar`, `nav-<đường-dẫn>`, `user-menu-btn`, `logout-btn`, `notifications-btn` |
| Hộp thoại xác nhận (dùng chung) | `src/components/ui/Ht/Dialog.tsx` | Các nút hành động | `dialog` (hoặc `testId` riêng), `dialog-confirm`, `dialog-cancel` |
| Thông báo nhanh / callout | `src/components/ui/Ht/Toast.tsx, Callout.tsx` | Sau thao tác | `toast`, `callout-<tone>` |
| QL CLB · Bảng điều khiển | `src/pages/manager/ManagerDashboard/` | `/manager` | `nav-manager`, `page-title` |
| QL CLB · Hàng chờ đăng ký ngựa | `src/pages/manager/ManagerRegistrationQueue/` | `/manager/registrations` | `nav-manager-registrations` |
| QL CLB · Duyệt hồ sơ ngựa (cấp chuồng) | `src/pages/manager/ManagerRegistrationDetail/` | `/manager/registrations/:id` | `approve-registration-dialog`, `approve-stall-select`, `approve-note-input`, `reject-registration-dialog` |
| QL CLB · Theo dõi y tế | `src/pages/manager/ManagerMedicalMonitoring/` | `/manager/medical-monitoring` | `nav-manager-medical-monitoring`, `medical-monitoring-empty` |
| QL CLB · Hóa đơn | `src/pages/manager/ManagerInvoices/` | `/manager/invoices` | `nav-manager-invoices`, `generate-invoices-btn`, `generate-invoices-dialog`, `generate-month-input`, `stall-fee-btn`, `stall-fee-dialog`, `cancel-invoice-btn`, `cancel-invoice-dialog` |
| QL CLB · Báo cáo tài chính | `src/pages/manager/ManagerFinanceReport/` | `/manager/reports` | `nav-manager-reports` |
| QL CLB · Người dùng & phân quyền | `src/pages/manager/ManagerUsers/` | `/manager/users` · nút "Phân công" | `nav-manager-users`, `assign-<username>`, `trainer-horses-dialog`, `trainer-horse-<horseId>`, `groom-zone-dialog`, `groom-zone-<Khu X>` |
| QL CLB · Nhật ký hệ thống | `src/pages/manager/ManagerAuditLogs/` | `/manager/audit-logs` | `nav-manager-audit-logs` |
| HLV · Tổng quan đàn ngựa | `src/pages/trainer/TrainerHerdOverview/` | `/trainer` | `nav-trainer` |
| HLV · Hồ sơ ngựa | `src/pages/trainer/TrainerHorseRecord/` | `/trainer/horses/:id` | `back-btn` |
| HLV · Giáo án | `src/pages/trainer/TrainerPlans/` | `/trainer/plans` · nút “Hủy” / “Chạy lại” trên từng dòng | `nav-trainer-plans`, `cancel-plan-<mã>`, `resume-plan-<mã>`, `cancel-plan-dialog`, `cancel-plan-reason` (ô lý do), `resume-plan-dialog` |
| HLV · Tạo giáo án | `src/pages/trainer/TrainerPlanCreate/` | `/trainer/plans/new` | `back-btn` |
| HLV · Lịch tập + phân công phiên | `src/pages/trainer/TrainerSchedule/` | `/trainer/schedule` · nút “Phân công phiên tập” | `nav-trainer-schedule`, `assign-session-dialog`, `assign-zone-select`, `assign-horse-select`, `assign-date-input`, `assign-time-input`, `assign-groom-select`, `assign-track-input` |
| HLV · Chi tiết phiên tập | `src/pages/trainer/TrainerSessionDetail/` | `/trainer/sessions/:id` | `back-btn` |
| HLV · Giải đua & đề xuất | `src/pages/trainer/TrainerRaces/` | `/trainer/races` | `nav-trainer-races` |
| HLV · Tạo đề xuất thi đấu | `src/pages/trainer/TrainerProposalCreate/` | `/trainer/races/new` | `back-btn` |
| HLV · Sơ đồ chuồng | `src/pages/trainer/StableMap/` | `/trainer/stable` | `nav-trainer-stable` |
| Bác sĩ · Đàn ngựa | `src/pages/vet/VetHerd/` | `/vet` | `nav-vet` |
| Bác sĩ · Ca bệnh | `src/pages/vet/VetInbox/` | `/vet/cases` | `nav-vet-cases` |
| Bác sĩ · Sức khỏe ngựa | `src/pages/vet/VetHorseHealth/` | `/vet/horses/:id` | `back-btn` |
| Bác sĩ · Phác đồ | `src/pages/vet/VetProtocols/` | `/vet/protocols` | `nav-vet-protocols` |
| Bác sĩ · Tạo phác đồ | `src/pages/vet/VetProtocolCreate/` | `/vet/protocols/new` | `back-btn` |
| Bác sĩ · Chi tiết phác đồ | `src/pages/vet/VetProtocolDetail/` | `/vet/protocols/:id` · nút “Thêm vật tư / thuốc” (phác đồ chưa cấp thuốc) | `back-btn`, `add-items-btn`, `add-items-dialog`, `add-item-phase`, `add-item-select`, `add-item-qty`, `add-item-line`, `add-item-list`, `cancel-protocol-btn` (hủy kèm lý do, ô `pd-text`) |
| Bác sĩ · Thuốc | `src/pages/vet/VetMedicines/` | `/vet/medicines` | `nav-vet-medicines` |
| Bác sĩ · Tiêm phòng | `src/pages/vet/VetVaccinations/` | `/vet/vaccinations` | `nav-vet-vaccinations` |
| Bác sĩ · Khám trước thi đấu | `src/pages/vet/VetRaceExams/` | `/vet/race-exams` | `nav-vet-race-exams` |
| Mã phu · Việc hôm nay | `src/pages/groom/GroomTodayTasks/` | `/groom` | `nav-groom` |
| Mã phu · Chuồng phụ trách | `src/pages/groom/GroomStable/` | `/groom/stable` | `nav-groom-stable` |
| Mã phu · Phiên tập | `src/pages/groom/GroomSessions/` | `/groom/sessions` | `nav-groom-sessions` |
| Mã phu · Thực hiện phiên | `src/pages/groom/GroomSessionRun/` | `/groom/sessions/:id` | `back-btn`, `confirm-session-btn`, `start-session-btn` |
| Mã phu · Báo sự cố | `src/pages/groom/GroomIncidents/` | `/groom/incidents` | `nav-groom-incidents` |
| Mã phu · Yêu cầu vật tư | `src/pages/groom/GroomRequests/` | `/groom/requests` | `nav-groom-requests`, `cancel-requisition-btn` |
| Chủ ngựa · Ngựa của tôi | `src/pages/owner/OwnerHorses/` | `/owner` | `nav-owner` |
| Chủ ngựa · Chi tiết ngựa | `src/pages/owner/OwnerHorseDetail/` | `/owner/horses/:id` | `back-btn` |
| Chủ ngựa · Xác nhận thi đấu | `src/pages/owner/OwnerRaces/` | `/owner/races` | `nav-owner-races` |
| Chủ ngựa · Hóa đơn | `src/pages/owner/OwnerInvoices/` | `/owner/invoices` (VNPay quay về `?status=`) | `nav-owner-invoices`, `vnpay-result` |
| Chủ ngựa · Chi tiết hóa đơn | `src/pages/owner/OwnerInvoiceDetail/` | `/owner/invoices/:id` | `back-btn` |
| Chủ ngựa · Lịch sử thanh toán | `src/pages/owner/OwnerPayments/` | `/owner/payments` | `nav-owner-payments` |
| Chủ ngựa · Đăng ký ngựa mới | `src/pages/owner/OwnerRegistrations/` | `/owner/registrations` | `nav-owner-registrations` |
| Chủ ngựa · Tạo hồ sơ ngựa | `src/pages/owner/OwnerRegistrationCreate/` | `/owner/registrations/new` | `back-btn`, `registration-form`, `rg-name-input`, `rg-breed-input` (danh sách `rg-breed-list`, mục `rg-breed-option`), `rg-age-input`, `rg-color-input`, `rg-height-input`, `rg-weight-input`, `rg-owner-phone`, `doc-own-input`, `doc-health-input`, `registration-submit` |
| Chủ ngựa · Thanh toán VNPay (mô phỏng) | `src/pages/owner/VNPayMock/` | `/payment/vnpay/:id` | — |
| Kho · Tồn kho | `src/pages/warehouse/WarehouseInventory/` | `/warehouse` | `nav-warehouse` |
| Kho · Phác đồ cần cấp | `src/pages/warehouse/WarehouseMedical/` | `/warehouse/medical` · tab “Bác sĩ đã đổi / hủy” | `nav-warehouse-medical`, `replaces-<mã>` |
| Kho · Chi tiết cấp phát | `src/pages/warehouse/WarehouseMedicalDetail/` | `/warehouse/medical/:id` | `back-btn`, `protocol-changes` (so với bản cũ), `protocol-superseded`, `protocol-cancelled` |
| Kho · Yêu cầu vật tư | `src/pages/warehouse/WarehouseRequisitions/` | `/warehouse/requisitions` | `nav-warehouse-requisitions` |
| Kho · Lô hàng nhập | `src/pages/warehouse/WarehouseShipments/` | `/warehouse/shipments` | `nav-warehouse-shipments` |
| Kho · Kiểm kê | `src/pages/warehouse/WarehouseStockCheck/` | `/warehouse/check` | `nav-warehouse-check` |
| Kho · Nhật ký kho | `src/pages/warehouse/WarehouseLog/` | `/warehouse/log` | `nav-warehouse-log` |
| QL CLB · Phát hành / hủy hóa đơn, phí lưu chuồng (tính năng mới) | `src/features/invoice-billing/` | Nút trên trang `/manager/invoices` (chỉ khi chạy backend) | `generate-invoices-btn`, `stall-fee-btn`, `cancel-invoice-btn` |
| HLV / Bác sĩ / Mã phu · Thực đơn dinh dưỡng (tính năng mới) | `src/features/nutrition-plan/` | Panel trong `/trainer/horses/:id` (Tổng quan), `/vet/horses/:id` (Khẩu phần / thực đơn), `/groom/stable` (Thực đơn hôm nay) — chỉ khi chạy backend | `nutrition-panel`, `nutrition-create-btn`, `nutrition-edit-btn`, `nutrition-cancel-btn`, `nutrition-plan-dialog`, `nutrition-start-input`, `nutrition-end-input`, `nutrition-meal-select-<i>`, `nutrition-item-select-<i>`, `nutrition-qty-input-<i>`, `nutrition-remove-line-<i>`, `nutrition-add-line`, `nutrition-notes-input`, `nutrition-cancel-dialog`, `nutrition-history-toggle`, `feed-request-btn`, `feed-approve-<mã>`, `feed-reject-<mã>` |
| Không tìm thấy (404) | `src/pages/shared/NotFound/` | Địa chỉ không tồn tại | — |

## Kịch bản tự kiểm (`scenarios/`)

| File | Kiểm tra |
| :--- | :--- |
| `scenarios/sign-in.spec.ts` | Khách vào `/` → `/login`; sai mật khẩu báo lỗi; 6 vai trò đăng nhập đúng trang chủ và đăng xuất được |
| `scenarios/menu-pages.spec.ts` | Mỗi vai trò bấm lần lượt mọi mục menu trái: trang mở được, không lỗi console |
| `scenarios/trainer-horses.spec.ts` | QL CLB giao cho HLV ngựa ở nhiều khu (không chọn khu), có bàn giao ngựa của HLV khác |
| `scenarios/groom-zone.spec.ts` | Mã phu chỉ một khu; khu đã có Mã phu khác bị khóa |
| `scenarios/assign-session.spec.ts` | Hộp phân công phiên tập: ngày mặc định hôm nay, không chọn được ngày đã qua |
| `scenarios/registration-validation.spec.ts` | Đăng ký chủ ngựa: SĐT/email đúng định dạng, họ tên không bắt buộc; hồ sơ ngựa: gợi ý + validate giống, không còn hộ chiếu, chặn tệp đổi đuôi |
| `scenarios/layout-alignment.spec.ts` | Mọi trang menu + trang tạo (giáo án, đề xuất, phác đồ, hồ sơ ngựa, hồ sơ cá nhân, đổi mật khẩu, đăng ký) của 6 vai trò ở 1280px và 1920px: ô nhập cùng hàng phải thẳng hàng, ô chọn không bị cắt chữ, trang không cuộn ngang |
| `scenarios/plan-cancel-resume.spec.ts` | HLV hủy giáo án phải ghi lý do, giáo án chuyển sang Lịch sử; giáo án tạm dừng có nút “Chạy lại” |
| `scenarios/protocol-add-items.spec.ts` | Bác sĩ thêm thuốc vào phác đồ đủ hàng → tạo phiên bản 2 gửi kho kiểm tồn; số lượng < 1 bị chặn; có nút ở phác đồ thiếu hàng, không có khi đang điều trị; bác sĩ hủy phác đồ chờ kiểm tồn phải ghi lý do ≥ 10 ký tự; kho thấy bản bị thay ở tab “Bác sĩ đã đổi / hủy” và bảng thay đổi giữa 2 phiên bản |

## Kịch bản chạy với backend thật (`scenarios-live/`, lệnh `npm run scenarios:live`)

| File | Kiểm tra |
| :--- | :--- |
| `scenarios-live/live-endpoints.spec.ts` | Mỗi tài khoản trong `.env.live.local` / `.env.backend` (vai trò nhận theo tên: `*hlv*`, `*bacsi*`, `*maphu*`, `*kho*`, `*chungua*`, `admin`) gọi trực tiếp các API GET mà FE dùng, phải trả 2xx |
| `scenarios-live/live-pages.spec.ts` | Đăng nhập thật, bấm mọi mục menu + mở trang chi tiết bằng id thật; không lỗi 5xx / JavaScript / "Không tải được dữ liệu" |
