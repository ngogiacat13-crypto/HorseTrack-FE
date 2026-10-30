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
| Đăng nhập | `src/pages/auth/Login/` | `/login` (mặc định khi chưa đăng nhập) · tên đăng nhập, email hoặc số điện thoại | `login-form`, `username-input`, `password-input`, `login-submit`, `login-error`, `login-identifier-hint` |
| Đăng ký chủ ngựa (2 bước OTP email) | `src/pages/auth/Register/` | `/register` | `<tên-trường>-input`, `register-otp-form`, `register-otp-input`, `register-otp-submit`, `register-otp-resend`, `register-otp-back`, `register-otp-error` |
| Xác nhận tài khoản nhân viên | `src/pages/auth/ConfirmAccount/` | `/confirm-account?token=` (liên kết trong email) · đăng nhập nhận `?confirmed=&message=` | `confirm-account-ok`, `confirm-account-login`, `confirm-account-error`, `login-confirm-result` |
| Quên mật khẩu (OTP) | `src/pages/auth/ForgotPassword/` | `/forgot-password` | `<tên-trường>-input` |
| Đổi mật khẩu (OTP) | `src/pages/auth/ChangePassword/` | `/change-password` · menu tài khoản | `nav-change-password`, `menu-change-password`, `oldPassword-input`, `newPassword-input`, `confirmPassword-input`, `otp-input` |
| Hồ sơ cá nhân | `src/pages/auth/MyProfile/` | `/my-profile` · menu tài khoản · sửa tên, số điện thoại, mã chứng chỉ, kinh nghiệm (HLV), phòng khám (bác sĩ) | `nav-my-profile`, `menu-my-profile`, `profile-card`, `profile-fullname`, `profile-phone`, `profile-license`, `profile-experience`, `profile-clinic`, `profile-save`, `profile-save-error` |
| Hồ sơ ngựa (dùng chung) | `src/pages/shared/HorseProfile/` | `/horses/:id` | `page-title`, `back-btn` |
| Khung ứng dụng: menu trái, thanh trên | `src/components/layout/` | Sau khi đăng nhập | `sidebar`, `nav-<đường-dẫn>`, `user-menu-btn`, `logout-btn`, `notifications-btn` |
| Hộp thoại xác nhận (dùng chung) | `src/components/ui/Ht/Dialog.tsx` | Các nút hành động | `dialog` (hoặc `testId` riêng), `dialog-confirm`, `dialog-cancel` |
| Thông báo nhanh / callout | `src/components/ui/Ht/Toast.tsx, Callout.tsx` | Sau thao tác · thông báo đen hiện 10 giây | `toast`, `callout-<tone>` |
| QL CLB · Bảng điều khiển | `src/pages/manager/ManagerDashboard/` | `/manager` | `nav-manager`, `page-title` |
| QL CLB · Hàng chờ đăng ký ngựa | `src/pages/manager/ManagerRegistrationQueue/` | `/manager/registrations` | `nav-manager-registrations` |
| QL CLB · Duyệt hồ sơ ngựa (cấp chuồng) | `src/pages/manager/ManagerRegistrationDetail/` | `/manager/registrations/:id` · nút phê duyệt khóa khi thiếu giấy tờ sở hữu | `view-attachment-<id>` (mở giấy tờ), `attachment-file-name` (tên tệp rút gọn, rê chuột xem đủ), `attachments-empty`, `approve-registration-btn`, `approve-needs-docs`, `approve-registration-dialog`, `approve-stall-select`, `approve-note-input`, `reject-registration-dialog` |
| QL CLB · Theo dõi y tế | `src/pages/manager/ManagerMedicalMonitoring/` | `/manager/medical-monitoring` | `nav-manager-medical-monitoring`, `medical-monitoring-empty` |
| QL CLB · Hóa đơn | `src/pages/manager/ManagerInvoices/` | `/manager/invoices` | `nav-manager-invoices`, `generate-invoices-btn`, `generate-invoices-dialog`, `generate-month-input`, `stall-fee-btn`, `stall-fee-dialog`, `cancel-invoice-btn`, `cancel-invoice-dialog` |
| QL CLB · Báo cáo tài chính | `src/pages/manager/ManagerFinanceReport/` | `/manager/reports` | `nav-manager-reports` |
| QL CLB · Người dùng & phân quyền | `src/pages/manager/ManagerUsers/` | `/manager/users` · tạo tài khoản Người chăm ngựa không chọn khu chuồng · nút "Phân khu" gửi yêu cầu, nhân viên xác nhận rồi phân công mới có hiệu lực · khóa tài khoản gửi email | `nav-manager-users`, `assign-<username>`, `trainer-horses-dialog`, `trainer-horse-<horseId>`, `trainer-pending-<horseId>`, `groom-zone-dialog`, `groom-zone-<Khu X>`, `groom-zone-pending`, `assignment-waiting`, `pending-confirm-<username>` (chờ xác nhận email), `resend-confirm-<username>` (gửi lại mail), `lock-reason` |
| QL CLB · Nhật ký hệ thống | `src/pages/manager/ManagerAuditLogs/` | `/manager/audit-logs` | `nav-manager-audit-logs` |
| HLV · Tổng quan đàn ngựa | `src/pages/trainer/TrainerHerdOverview/` | `/trainer` · hộp phân công chờ xác nhận · đề nghị khẩu phần chờ HLV duyệt | `nav-trainer`, `assignment-inbox`, `assignment-accept-<id>`, `assignment-reject-<id>`, `assignment-reject-dialog`, `assignment-reject-reason`, `diet-request-<mã>` |
| HLV · Hồ sơ ngựa | `src/pages/trainer/TrainerHorseRecord/` | `/trainer/horses/:id` · nút duyệt đề nghị chỉ khi `canDecide` | `back-btn`, `care-task-btn`, `diet-request-<mã>`, `feed-approve-<mã>`, `feed-reject-<mã>` |
| HLV · Giáo án | `src/pages/trainer/TrainerPlans/` | `/trainer/plans` · “Hủy” chỉ khi chưa bắt đầu · “Chạy lại” khi tạm dừng và bác sĩ đã đóng ca | `nav-trainer-plans`, `cancel-plan-<mã>`, `resume-plan-<mã>`, `plan-wait-vet-<mã>`, `cancel-plan-dialog`, `cancel-plan-reason` (ô lý do), `resume-plan-dialog` |
| HLV · Tạo giáo án | `src/pages/trainer/TrainerPlanCreate/` | `/trainer/plans/new` · đúng 1 giai đoạn, không thêm giai đoạn thứ hai | `back-btn`, `plan-single-phase` |
| HLV · Lịch tập + phân công phiên | `src/pages/trainer/TrainerSchedule/` | `/trainer/schedule` · nút “Phân công phiên tập” | `nav-trainer-schedule`, `assign-session-dialog`, `assign-zone-select`, `assign-horse-select`, `assign-date-input`, `assign-time-input`, `assign-groom-select`, `assign-track-input`, `evaluate-session-<mã>` (phiên hoàn thành hoặc đã dừng) |
| HLV · Chi tiết phiên tập | `src/pages/trainer/TrainerSessionDetail/` | `/trainer/sessions/:id` · phiên dừng giữa chừng kết thúc ngay (STOPPED), HLV đánh giá được | `back-btn`, `session-sent-vet` (đã gửi ca bác sĩ), `session-evaluate-btn` |
| HLV · Giải đua & đề xuất | `src/pages/trainer/TrainerRaces/` | `/trainer/races` | `nav-trainer-races` |
| HLV · Tạo đề xuất thi đấu | `src/pages/trainer/TrainerProposalCreate/` | `/trainer/races/new` | `back-btn` |
| HLV · Sơ đồ chuồng | `src/pages/trainer/StableMap/` | `/trainer/stable` | `nav-trainer-stable` |
| Bác sĩ · Đàn ngựa | `src/pages/vet/VetHerd/` | `/vet` | `nav-vet` |
| Bác sĩ · Ca bệnh | `src/pages/vet/VetInbox/` | `/vet/cases` · đóng ca chỉ khi phác đồ đã hoàn thành hoặc đã hủy | `nav-vet-cases` |
| Bác sĩ · Sức khỏe ngựa | `src/pages/vet/VetHorseHealth/` | `/vet/horses/:id` | `back-btn` |
| Bác sĩ · Phác đồ | `src/pages/vet/VetProtocols/` | `/vet/protocols` | `nav-vet-protocols` |
| Bác sĩ · Tạo phác đồ | `src/pages/vet/VetProtocolCreate/` | `/vet/protocols/new` · gửi kho kiểm tồn, không còn lưu nháp; hỗ trợ đánh dấu phác đồ cấp cứu; mỗi ca khám chỉ một phác đồ đang mở (mở lại ca đã có phác đồ thì chuyển sang phác đồ đó) | `back-btn`, `protocol-send-btn`, `protocol-emergency`, `create-protocol-btn`, `open-protocol-btn` |
| Bác sĩ · Chi tiết phác đồ | `src/pages/vet/VetProtocolDetail/` | `/vet/protocols/:id` · cấp thuốc, thanh toán và bác sĩ quyết định từng giai đoạn trước khi bắt đầu/kết thúc; có thể kết thúc giai đoạn và bắt đầu ngay giai đoạn sau khi đủ điều kiện | `back-btn`, `add-items-btn`, `add-items-dialog`, `add-item-phase`, `add-item-select`, `add-item-qty`, `add-item-line`, `add-item-list`, `cancel-protocol-btn`, `protocol-wait-btn`, `protocol-phase-start`, `protocol-phase-done`, `protocol-phase-done-start-next`, `protocol-phase-stop`, `protocol-phase-finish-blocked` (BE chưa cho kết thúc giai đoạn, kèm lý do) |
| Bác sĩ · Thuốc | `src/pages/vet/VetMedicines/` | `/vet/medicines` | `nav-vet-medicines` |
| Bác sĩ · Tiêm phòng | `src/pages/vet/VetVaccinations/` | `/vet/vaccinations` | `nav-vet-vaccinations` |
| Bác sĩ · Khám trước thi đấu | `src/pages/vet/VetRaceExams/` | `/vet/race-exams` | `nav-vet-race-exams` |
| Mã phu · Việc hôm nay | `src/pages/groom/GroomTodayTasks/` | `/groom` · hộp phân công khu chờ xác nhận · chọn ngày xem việc (`my-tasks?date=`), việc ngày sau chỉ xem trước; mỗi việc chỉ xác nhận được từ 30 phút trước giờ hẹn | `nav-groom`, `task-day-input`, `task-day-today`, `task-day-preview`, `task-<mã>`, `task-done-<mã>`, `task-locked-<mã>`, `assignment-inbox`, `assignment-accept-<id>`, `assignment-reject-<id>`, `assignment-reject-dialog`, `assignment-reject-reason` |
| Mã phu · Chuồng phụ trách | `src/pages/groom/GroomStable/` | `/groom/stable` | `nav-groom-stable` |
| Mã phu · Phiên tập | `src/pages/groom/GroomSessions/` | `/groom/sessions` | `nav-groom-sessions` |
| Mã phu · Thực hiện phiên | `src/pages/groom/GroomSessionRun/` | `/groom/sessions/:id` | `back-btn`, `confirm-session-btn`, `start-session-btn`, `session-adjusted` |
| Mã phu · Báo sự cố | `src/pages/groom/GroomIncidents/` | `/groom/incidents` | `nav-groom-incidents` |
| Mã phu · Yêu cầu vật tư | `src/pages/groom/GroomRequests/` | `/groom/requests` | `nav-groom-requests`, `cancel-requisition-btn` |
| Chủ ngựa · Ngựa của tôi | `src/pages/owner/OwnerHorses/` | `/owner` | `nav-owner` |
| Chủ ngựa · Chi tiết ngựa | `src/pages/owner/OwnerHorseDetail/` | `/owner/horses/:id` · lịch sử phiên tập và ghi chú trễ; thông báo và hóa đơn theo từng giai đoạn | `back-btn`, `plan-delay`, `session-late`, `phase-payment-notice` |
| Chủ ngựa · Xác nhận thi đấu | `src/pages/owner/OwnerRaces/` | `/owner/races` | `nav-owner-races` |
| Chủ ngựa · Hóa đơn | `src/pages/owner/OwnerInvoices/` | `/owner/invoices` (VNPay quay về `?status=`) | `nav-owner-invoices`, `vnpay-result` |
| Chủ ngựa · Chi tiết hóa đơn | `src/pages/owner/OwnerInvoiceDetail/` | `/owner/invoices/:id` | `back-btn` |
| Chủ ngựa · Lịch sử thanh toán | `src/pages/owner/OwnerPayments/` | `/owner/payments` | `nav-owner-payments` |
| Chủ ngựa · Đăng ký ngựa mới | `src/pages/owner/OwnerRegistrations/` | `/owner/registrations` | `nav-owner-registrations` |
| Chủ ngựa · Tạo hồ sơ ngựa | `src/pages/owner/OwnerRegistrationCreate/` | `/owner/registrations/new` | `back-btn`, `registration-form`, `rg-name-input`, `rg-breed-input` (danh sách `rg-breed-list`, mục `rg-breed-option`), `rg-age-input`, `rg-color-input`, `rg-height-input`, `rg-weight-input`, `rg-owner-phone`, `doc-own-input`, `doc-health-input`, `registration-submit` |
| Chủ ngựa · Thanh toán VNPay (mô phỏng) | `src/pages/owner/VNPayMock/` | `/payment/vnpay/:id` | — |
| Kho · Tồn kho | `src/pages/warehouse/WarehouseInventory/` | `/warehouse` | `nav-warehouse` |
| Kho · Phác đồ cần cấp | `src/pages/warehouse/WarehouseMedical/` | `/warehouse/medical` · tab “Bác sĩ đã đổi / hủy” | `nav-warehouse-medical`, `replaces-<mã>` |
| Kho · Chi tiết cấp phát | `src/pages/warehouse/WarehouseMedicalDetail/` | `/warehouse/medical/:id` · duyệt thuốc bổ sung khi đang điều trị | `back-btn`, `protocol-changes` (so với bản cũ), `protocol-superseded`, `protocol-cancelled`, `warehouse-review-supplement` |
| Kho · Yêu cầu vật tư | `src/pages/warehouse/WarehouseRequisitions/` | `/warehouse/requisitions` | `nav-warehouse-requisitions` |
| Kho · Lô hàng nhập | `src/pages/warehouse/WarehouseShipments/` | `/warehouse/shipments` | `nav-warehouse-shipments` |
| Kho · Kiểm kê | `src/pages/warehouse/WarehouseStockCheck/` | `/warehouse/check` · mở biên bản cũ thì tải chi tiết phiếu | `nav-warehouse-check`, `stock-check-<mã>` |
| Kho · Nhật ký kho | `src/pages/warehouse/WarehouseLog/` | `/warehouse/log` | `nav-warehouse-log` |
| QL CLB · Phát hành / hủy hóa đơn, phí lưu chuồng (tính năng mới) | `src/features/invoice-billing/` | Nút trên trang `/manager/invoices` (chỉ khi chạy backend) | `generate-invoices-btn`, `stall-fee-btn`, `cancel-invoice-btn` |
| HLV / Bác sĩ / Mã phu · Thực đơn dinh dưỡng (tính năng mới) | `src/features/nutrition-plan/` | Panel trong `/trainer/horses/:id` (Tổng quan), `/vet/horses/:id` (Khẩu phần / thực đơn), `/groom/stable` (Thực đơn hôm nay) — chỉ khi chạy backend | `nutrition-panel`, `nutrition-create-btn`, `nutrition-edit-btn`, `nutrition-cancel-btn`, `nutrition-feed-tasks-btn`, `nutrition-plan-dialog`, `nutrition-start-input`, `nutrition-end-input`, `nutrition-meal-select-<i>`, `nutrition-item-select-<i>`, `nutrition-qty-input-<i>`, `nutrition-remove-line-<i>`, `nutrition-add-line`, `nutrition-notes-input`, `nutrition-cancel-dialog`, `nutrition-history-toggle`, `feed-request-btn`, `feed-approve-<mã>`, `feed-reject-<mã>` |
| QL CLB · Nhật ký email (tính năng mới) | `src/features/email-logs/` | `/manager/email-logs` | `nav-manager-email-logs`, `email-log-search`, `email-log-status`, `email-log-purpose`, `email-log-from`, `email-log-to`, `email-log-table`, `email-log-empty`, `email-log-prev`, `email-log-next` |
| HLV · Giao việc chăm sóc cho Mã phu + theo dõi việc đã giao (tính năng mới) | `src/features/care-task-assign/` | Nút “Giao việc chăm sóc” và tab “Việc chăm sóc” ở `/trainer/horses/:id`; bảng “Việc chăm sóc đã giao” ở `/manager` (chỉ khi chạy backend) · loại việc không còn “Cho ăn”, “Cho thuốc” | `care-task-btn`, `care-task-dialog`, `care-task-groom`, `care-task-type`, `care-task-date`, `care-task-time`, `care-task-title`, `care-task-instructions`, `assigned-tasks-date`, `assigned-tasks-status`, `assigned-tasks-table`, `assigned-tasks-empty` |
| Kho · Thêm / sửa thông tin vật tư (tính năng mới) | `src/features/inventory-items/` | Nút “Thêm vật tư” và “Sửa” trên từng dòng ở `/warehouse` (chỉ khi chạy backend) | `new-item-btn`, `edit-item-<mã>`, `item-form-dialog`, `item-name`, `item-category`, `item-group`, `item-unit`, `item-price`, `item-safety`, `item-brand`, `item-route`, `item-withdrawal`, `item-dose`, `item-rx`, `item-controlled`, `item-note` |
| Kho · Nhà cung cấp (tính năng mới) | `src/features/suppliers/` | Nút “Nhà cung cấp” ở `/warehouse/shipments` (chỉ khi chạy backend); ô nhà cung cấp khi tạo đơn nhập gợi ý danh sách thật | `suppliers-btn`, `suppliers-dialog`, `suppliers-table`, `suppliers-empty`, `supplier-add-btn`, `supplier-edit-<id>`, `supplier-form-dialog`, `supplier-name`, `supplier-phone`, `supplier-email`, `supplier-address`, `supplier-active` |
| QL CLB · Trạng thái dịch vụ chủ ngựa (tính năng mới) | `src/features/owner-service/` | Nút “Dịch vụ” trên dòng chủ ngựa ở `/manager/users` (chỉ khi chạy backend) | `owner-service-<username>`, `owner-service-dialog`, `owner-service-status`, `owner-service-reason` |
| Chủ ngựa · Xem / gỡ giấy tờ hồ sơ (tính năng mới) | `src/features/registration-attachments/` | Trong từng thẻ hồ sơ ở `/owner/registrations`; nút “Gỡ” chỉ khi hồ sơ chờ duyệt (chỉ khi chạy backend) | `owner-attachments-<mã hồ sơ>`, `owner-view-attachment-<id>`, `remove-attachment-<id>`, `remove-attachment-dialog` |
| Không tìm thấy (404) | `src/pages/shared/NotFound/` | Địa chỉ không tồn tại | — |

## Kịch bản tự kiểm (`scenarios/`)

| File | Kiểm tra |
| :--- | :--- |
| `scenarios/sign-in.spec.ts` | Khách vào `/` → `/login`; sai mật khẩu báo lỗi; 6 vai trò đăng nhập đúng trang chủ và đăng xuất được |
| `scenarios/menu-pages.spec.ts` | Mỗi vai trò bấm lần lượt mọi mục menu trái: trang mở được, không lỗi console |
| `scenarios/trainer-horses.spec.ts` | QL CLB giao cho HLV ngựa ở nhiều khu (không chọn khu), có bàn giao ngựa của HLV khác |
| `scenarios/groom-zone.spec.ts` | Tạo tài khoản Người chăm ngựa không có ô khu chuồng; Mã phu chỉ một khu; khu đã có Mã phu khác bị khóa |
| `scenarios/assign-session.spec.ts` | Hộp phân công phiên tập: ngày mặc định hôm nay, không chọn được ngày đã qua |
| `scenarios/registration-validation.spec.ts` | Đăng ký chủ ngựa: SĐT/email đúng định dạng, họ tên không bắt buộc; đăng ký phải nhập OTP (mã sai báo lỗi, đúng thì thành công); hồ sơ ngựa: gợi ý + validate giống, không còn hộ chiếu, chặn tệp đổi đuôi |
| `scenarios/layout-alignment.spec.ts` | Mọi trang menu + trang tạo (giáo án, đề xuất, phác đồ, hồ sơ ngựa, hồ sơ cá nhân, đổi mật khẩu, đăng ký) của 6 vai trò ở 1280px và 1920px: ô nhập cùng hàng phải thẳng hàng, ô chọn không bị cắt chữ, trang không cuộn ngang |
| `scenarios/plan-cancel-resume.spec.ts` | HLV hủy giáo án phải ghi lý do, giáo án chuyển sang Lịch sử; giáo án tạm dừng có nút “Chạy lại” |
| `scenarios/protocol-add-items.spec.ts` | Bác sĩ thêm thuốc vào phác đồ đủ hàng → tạo phiên bản 2 gửi kho kiểm tồn; số lượng < 1 bị chặn; có nút ở phác đồ thiếu hàng, không có khi đang điều trị; đang điều trị thì bổ sung thuốc kèm lý do (không tạo phiên bản); bác sĩ hủy phác đồ chờ kiểm tồn phải ghi lý do ≥ 10 ký tự; kho thấy bản bị thay ở tab “Bác sĩ đã đổi / hủy” và bảng thay đổi giữa 2 phiên bản |
| `scenarios/session-stop-evaluate.spec.ts` | Phiên HLV dừng và gửi bác sĩ kết thúc ngay (không còn “chờ bác sĩ”), HLV đánh giá được phiên đã dừng |
| `scenarios/nutrition-start-date.spec.ts` | Thực đơn mới không bắt đầu ở ngày đã qua; sửa thực đơn đang chạy giữ được ngày bắt đầu cũ nhưng không lùi về quá khứ |
| `scenarios/groom-task-day.spec.ts` | Mã phu chọn ngày mai xem trước việc (nhãn “NGÀY SAU”, không có nút hoàn thành), bấm “Hôm nay” quay lại việc hôm nay; việc chưa tới 30 phút trước giờ hẹn bị khóa xác nhận |
| `scenarios/staff-email.spec.ts` | QL CLB có menu Nhật ký email; link xác nhận thiếu mã báo lỗi; trang đăng nhập hiện kết quả xác nhận tài khoản |

## Kịch bản chạy với backend thật (`scenarios-live/`, lệnh `npm run scenarios:live`)

| File | Kiểm tra |
| :--- | :--- |
| `scenarios-live/live-endpoints.spec.ts` | Mỗi tài khoản trong `.env.live.local` / `.env.backend` (vai trò nhận theo tên: `*hlv*`, `*bacsi*`, `*maphu*`, `*kho*`, `*chungua*`, `admin`) gọi trực tiếp các API GET mà FE dùng, phải trả 2xx |
| `scenarios-live/live-pages.spec.ts` | Đăng nhập thật, bấm mọi mục menu + mở trang chi tiết bằng id thật; không lỗi 5xx / JavaScript / "Không tải được dữ liệu" |
