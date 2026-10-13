/* Static content of the public home page — taken from the functional spec (roles, flows, business rules). */
import type { IconName } from '../../../components/ui/Icon';

export const ROLES: { icon: IconName; name: string; en: string; text: string; items: string[] }[] = [
  { icon: 'shield', name: 'Quản lý CLB', en: 'ClubManager', text: 'Duyệt hồ sơ ngựa, giám sát y tế, tài chính và tài khoản.', items: ['Duyệt / từ chối hồ sơ ngựa', 'Giám sát phác đồ (không duyệt chuyên môn)', 'Hóa đơn, đình chỉ, kích hoạt lại', 'Báo cáo & nhật ký kiểm toán'] },
  { icon: 'trend', name: 'HLV trưởng', en: 'HeadTrainer', text: 'Lập giáo án, phân công phiên tập và đề xuất thi đấu.', items: ['Giáo án theo giai đoạn', 'Lịch tập theo khu chuồng', 'Quyết định khi phiên tạm dừng', 'Đề xuất thi đấu'] },
  { icon: 'heart', name: 'Bác sĩ thú y', en: 'Veterinarian', text: 'Khám, khóa huấn luyện, lập phác đồ và khám trước thi đấu.', items: ['Hộp thư ca khám', 'Sơ đồ chấn thương 2D', 'Phác đồ & kiểm tra tồn thuốc', 'Tiêm phòng, khám thi đấu'] },
  { icon: 'task', name: 'Người chăm ngựa', en: 'Groom', text: 'Thực hiện chăm sóc hằng ngày và chạy phiên tập được giao.', items: ['Công việc hôm nay (SLA 45 phút)', 'Nhập chỉ số phiên tập', 'Báo cáo sự cố', 'Yêu cầu vật tư'] },
  { icon: 'box', name: 'Quản lý kho', en: 'WarehouseManager', text: 'Kiểm tồn, giữ hàng, cấp phát thuốc và nhập hàng.', items: ['Tồn kho / giữ / khả dụng', 'Thuốc theo phác đồ', 'Đơn nhập hàng & ETA', 'Kiểm kê tháng'] },
  { icon: 'user', name: 'Chủ ngựa', en: 'HorseOwner', text: 'Theo dõi ngựa của mình, xác nhận thi đấu và thanh toán.', items: ['Hồ sơ, sức khỏe, phong độ', 'Đồng ý / từ chối thi đấu', 'Hóa đơn & VNPay', 'Đăng ký ngựa mới'] },
];

export const FLOWS: { title: string; who: string; steps: string[] }[] = [
  { title: 'Đăng ký ngựa mới', who: 'Chủ ngựa → Quản lý CLB', steps: ['Nộp hồ sơ + giấy tờ', 'PENDING_REVIEW', 'Checklist 4 mục', 'APPROVED / REJECTED'] },
  { title: 'Phiên tập vượt ngưỡng', who: 'Mã phu → HLV → Bác sĩ', steps: ['Nhập chỉ số', 'Tự tạm dừng (BR_02)', 'HLV quyết định', 'Tiếp tục / chuyển Bác sĩ'] },
  { title: 'Phác đồ & thuốc', who: 'Bác sĩ ↔ Quản lý kho', steps: ['Lập phác đồ', 'Kho kiểm tồn', 'Giữ hàng / chờ ETA', 'Bác sĩ xác nhận → cấp thuốc'] },
  { title: 'Thi đấu', who: 'HLV → Bác sĩ → Chủ ngựa', steps: ['Đề xuất', 'Khám trước thi đấu', 'Chủ ngựa đồng ý', 'READY_TO_SUBMIT'] },
  { title: 'Vật tư chuồng trại', who: 'Mã phu → Quản lý kho', steps: ['Gửi yêu cầu', 'Kiểm tồn', 'Cấp phát / chờ hàng', 'Mã phu xác nhận nhận'] },
  { title: 'Hóa đơn quá hạn', who: 'Hệ thống → Chủ ngựa → Quản lý CLB', steps: ['Quá 10 ngày: phạt', 'Đạt 25 ngày: đình chỉ', 'Thanh toán VNPay + xác minh', 'Kích hoạt lại'] },
];

export const RULES: [string, string][] = [
  ['BR_01', 'Chỉ Bác sĩ thú y khóa / mở khóa huấn luyện.'],
  ['BR_02', 'Vượt ngưỡng nhịp tim hoặc tốc độ → phiên tự tạm dừng.'],
  ['BR_04', 'Chủ ngựa chỉ xác nhận thi đấu sau kết quả khám ĐẠT.'],
  ['BR_07', 'Bác sĩ quyết định phác đồ; kho chỉ kiểm tồn và cấp phát.'],
  ['BR_09', 'Chủ ngựa chỉ xem dữ liệu ngựa mình sở hữu.'],
  ['BR_12–14', 'Phí phạt, đình chỉ và kích hoạt lại theo cấu hình CLB.'],
];
