# Quy tắc cho AI Agent (Claude, Cursor, Copilot…)

Nguyên tắc: con đường ngắn nhất của AI phải là con đường đúng chuẩn. Các luật dưới đây được **máy kiểm tra** (lint, typecheck, kịch bản trình duyệt, CI), không chỉ nhắc bằng lời.

## 1. Phạm vi chỉnh sửa
- Tính năng **mới**: đặt toàn bộ UI, state, logic, kịch bản kiểm thử vào `src/features/<ten-tinh-nang>/`
  (`<Ten>.tsx`, `state.ts`, `logic.ts`, `index.ts`). Không rải code sang thư mục khác.
- Code hiện có (`src/pages/<vai-trò>/`, `src/api/<vai-trò>Api/`) giữ nguyên cấu trúc; chỉ sửa đúng thư mục màn hình được giao.
- Không tự ý sửa module dùng chung (`src/components/ui`, `src/components/layout`, `src/api/http.ts`, `beClient.ts`, `hybridAdapter.ts`, `src/routers`) nếu yêu cầu không nói rõ.
- Nguồn nghiệp vụ chuẩn: file đặc tả "chức năng và role"; danh sách API đã nối: `NotesAPI.md`.

## 2. Không viết comment
- CẤM comment giải thích code, lịch sử sửa lỗi, ghi chú quy tắc trong `src/`, `scenarios/` và file cấu hình TS.
- Đặt tên biến/hàm tự mô tả. Lý do thay đổi ghi vào **commit message**.
- Chỉ được giữ chỉ thị công cụ: `eslint-disable…`, `@ts-expect-error`, `/// <reference …>`.
- Luật `local/no-comments` (thư mục `lint-rules/`) báo **lỗi đỏ** khi có comment.

## 3. Định danh giao diện (`data-testid`)
- Mọi thành phần tương tác mới (nút, ô nhập, select, form, hộp thoại) phải có `data-testid` rõ nghĩa, dạng `kebab-case`.
- Có sẵn: `FormikField` tự gắn `<name>-input`; `Dialog` nhận `testId` + nút `dialog-confirm` / `dialog-cancel`;
  menu trái `nav-<đường-dẫn>`; `page-title`, `back-btn`, `toast`, `user-menu-btn`, `logout-btn`.
- Thêm/sửa màn hình hoặc `data-testid` ⇒ cập nhật `feature-map.md` trong cùng PR.

## 4. Tự kiểm tra trước khi báo xong
Chạy và sửa đến khi **pass 100%**, tự đọc log lỗi:

```bash
npm run check
```

= `npm run lint` (0 lỗi) → `npm run typecheck` → `npm run scenarios` (Playwright tự bật app ở cổng 5199 với dữ liệu mẫu,
đăng nhập 6 vai trò, mở mọi trang menu, bắt lỗi console). Lần đầu trên máy mới: `npx playwright install chromium`.
Xem trình duyệt chạy: `npx playwright test --headed`; xem lại lỗi: `npx playwright show-trace test-results/<tên>/trace.zip`.

- Sửa màn hình nào ⇒ thêm/sửa kịch bản tương ứng trong `scenarios/` (đặt tên theo hành vi, vd `assign-session.spec.ts`).
- Tài khoản dữ liệu mẫu lấy từ `db.json` (xem `scenarios/support.ts`), không ghi mật khẩu thật vào code.
- Khi nối backend thật: bật backend (cổng 8080) rồi chạy `npm run scenarios:live` (thư mục `scenarios-live/`, chỉ đọc, tài khoản lấy từ `.env.backend`).
  Mọi trang phải không có lỗi 5xx/JavaScript; kết quả chi tiết ở `test-results/live-report/`. Ghi kết luận vào `NotesAPI.md`.

## 5. Quy tắc 2 lần
Một lỗi/anti-pattern bị nhắc lần thứ 2 ⇒ biến thành luật tự động: thêm rule vào `eslint.config.js` / `lint-rules/`
hoặc thêm kịch bản vào `scenarios/`, để CI (`.github/workflows/check.yml`) chặn merge.

## 6. Git
- Không commit/push khi chưa được yêu cầu. Nhánh làm việc chung: `dev`.
- CI chạy `lint` + `typecheck` + `scenarios` cho mọi push lên `main`/`dev` và mọi Pull Request.
