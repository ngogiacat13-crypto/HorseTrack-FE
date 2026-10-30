import type { IconName } from '../../../components/ui/Icon';

export const ROLES: { icon: IconName; name: string; en: string; text: string; items: string[] }[] = [
  { icon: 'shield', name: 'Quản lý CLB', en: 'ClubManager', text: 'Duyệt hồ sơ ngựa, giám sát y tế, tài chính và tài khoản.', items: ['Duyệt / từ chối hồ sơ ngựa', 'Giám sát phác đồ (không duyệt chuyên môn)', 'Hóa đơn, đình chỉ, kích hoạt lại', 'Báo cáo & nhật ký kiểm toán'] },
  { icon: 'trend', name: 'HLV trưởng', en: 'HeadTrainer', text: 'Lập giáo án, phân công phiên tập và đề xuất thi đấu.', items: ['Giáo án theo giai đoạn', 'Lịch tập theo khu chuồng', 'Quyết định khi phiên tạm dừng', 'Đề xuất thi đấu'] },
  { icon: 'heart', name: 'Bác sĩ thú y', en: 'Veterinarian', text: 'Khám, khóa huấn luyện, lập phác đồ và khám trước thi đấu.', items: ['Hộp thư ca khám', 'Sơ đồ chấn thương 2D', 'Phác đồ & kiểm tra tồn thuốc', 'Tiêm phòng, khám thi đấu'] },
  { icon: 'task', name: 'Người chăm ngựa', en: 'Groom', text: 'Thực hiện chăm sóc hằng ngày và chạy phiên tập được giao.', items: ['Công việc hôm nay (SLA 45 phút)', 'Nhập chỉ số phiên tập', 'Báo cáo sự cố', 'Yêu cầu vật tư'] },
  { icon: 'box', name: 'Quản lý kho', en: 'WarehouseManager', text: 'Kiểm tồn, giữ hàng, cấp phát thuốc và nhập hàng.', items: ['Tồn kho / giữ / khả dụng', 'Thuốc theo phác đồ', 'Đơn nhập hàng & ETA', 'Kiểm kê tháng'] },
  { icon: 'user', name: 'Chủ ngựa', en: 'HorseOwner', text: 'Theo dõi ngựa của mình, xác nhận thi đấu và thanh toán.', items: ['Hồ sơ, sức khỏe, phong độ', 'Đồng ý / từ chối thi đấu', 'Hóa đơn & VNPay', 'Đăng ký ngựa mới'] },
];

export const CORE_FEATURES: { id: string; icon: IconName; title: string; text: string; tone: string; highlights?: string[] }[] = [
  { id: 'feature-tournaments', icon: 'trend', title: 'QUẢN LÝ GIẢI ĐẤU', text: 'Thiết lập điều lệ, thời gian đăng ký, tiêu chí và giải thưởng cho từng cuộc đua.', tone: 'green', highlights: ['Thiết lập giải', 'Mở đăng ký', 'Ghi nhận kết quả'] },
  { id: 'feature-registration', icon: 'clip', title: 'ĐĂNG KÝ NGỰA DỰ THI', text: 'Chủ ngựa chọn ngựa đủ điều kiện, gửi đề xuất và theo dõi tiến độ hồ sơ.', tone: 'gold' },
  { id: 'feature-race-checks', icon: 'heart', title: 'HLV & KHÁM THÚ Y', text: 'HLV xác nhận khả năng tham gia; bác sĩ hoàn tất khám trước thi đấu.', tone: 'teal' },
  { id: 'feature-training', icon: 'calendar', title: 'LỊCH TẬP & GIÁO ÁN', text: 'Lập giáo án theo giai đoạn, xếp phiên tập và theo dõi trạng thái từng buổi.', tone: 'blue' },
  { id: 'feature-health', icon: 'task', title: 'SỨC KHỎE & CHĂM SÓC NGỰA', text: 'Theo dõi hồ sơ sức khỏe, ca khám, tiêm phòng và công việc chăm sóc hằng ngày.', tone: 'purple' },
  { id: 'feature-warehouse', icon: 'box', title: 'KHO & DINH DƯỠNG', text: 'Kiểm tồn, cấp thuốc theo phác đồ, quản lý yêu cầu vật tư và thực đơn.', tone: 'green' },
  { id: 'feature-results', icon: 'chart', title: 'KẾT QUẢ & TIỀN THƯỞNG', text: 'Ghi nhận thứ hạng, thành tích và tiền thưởng để chủ ngựa theo dõi.', tone: 'gold', highlights: ['Thứ hạng', 'Thành tích', 'Tiền thưởng'] },
];
