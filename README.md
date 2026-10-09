# 🐴 HorseTrack

Giao diện demo hệ thống quản lý huấn luyện & chăm sóc ngựa đua  
(React 18 + TypeScript + Vite + React-Bootstrap + React Router).

## Chạy dự án

```bash
npm install
npm run dev      # chạy dev tại http://localhost:5173
npm run build    # kiểm tra kiểu + build production
npm run preview  # xem bản build
```

## Đăng nhập demo

Không cần mật khẩu — chọn một tài khoản trên màn hình đăng nhập:

| Vai trò | Trang chủ |
|---|---|
| ClubManager (Quản lý CLB) | `/manager` |
| HeadTrainer (HLV trưởng) | `/trainer` |
| Veterinarian (Bác sĩ thú y) | `/vet` |
| Groom (Người chăm ngựa) | `/groom` |
| HorseOwner (Chủ ngựa) | `/owner` |
| WarehouseManager (Thủ kho) | `/warehouse` |

## Đăng ký tài khoản và ngựa đua

Mở `/register` hoặc chọn **Đăng ký ngay** ở màn hình đăng nhập. Luồng 3 bước tạo hồ sơ Chủ ngựa và hồ sơ ngựa đua theo các bảng `Users`, `Horse_Owner_Profiles` và `Horses` trong `Data4.txt`.

Vì project hiện là frontend demo chưa có API, dữ liệu đăng ký được lưu tạm trong `localStorage` với trạng thái `Registered` để mô phỏng hồ sơ chờ CLB phê duyệt.

## Cấu trúc

```
src/
├── api/mockData.ts            # Dữ liệu giả lập, Types, ROLE_HOME
├── auth/AuthContext.tsx       # AuthProvider + useAuth
├── components/
│   ├── layout/                # AppLayout (Topbar), Sidebar
│   └── ui/                    # StatusBadge, StatCard, HorseCard
├── pages/
│   ├── Login.tsx
│   ├── manager/               # Dashboard, hàng đợi & chi tiết đăng ký ngựa
│   ├── trainer/               # Tổng quan đàn ngựa
│   ├── groom/                 # Công việc hôm nay
│   ├── owner/                 # Đăng ký ngựa theo schema Horses, Hóa đơn
│   └── shared/                # Hồ sơ ngựa
├── App.tsx                    # Routing + phân quyền theo vai trò
├── main.tsx
└── index.css
```

Các màn hình chưa phát triển hiển thị trang `Placeholder`.
