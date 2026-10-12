import React from 'react';
import type { ManagedUser } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Panel } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

type Role = ManagedUser['role'];

/* Spec §4 role × function matrix. 'y' = có quyền, 'n' = không, other text = qualifier. */
const RBAC: [string, ...string[]][] = [
  ['Đăng nhập · đổi mật khẩu', 'y', 'y', 'y', 'y', 'y', 'y'],
  ['Duyệt hồ sơ ngựa mới', 'y', 'n', 'n', 'n', 'n', 'Gửi hồ sơ'],
  ['Người dùng · RBAC · Audit Log', 'y', 'n', 'n', 'n', 'n', 'n'],
  ['Lập giáo án · phân công lịch tập', 'n', 'y', 'n', 'n', 'n', 'n'],
  ['Nhập chỉ số phiên tập', 'n', 'Xem', 'Xem', 'n', 'y', 'n'],
  ['Quyết định tiếp tục phiên tập', 'n', 'y', 'n', 'n', 'n', 'n'],
  ['Tạo · xác nhận phác đồ', 'Xem', 'Xem', 'y', 'n', 'Xem', 'Xem'],
  ['Kiểm tồn · giữ · cấp phát vật tư', 'Xem', 'n', 'Yêu cầu', 'y', 'n', 'n'],
  ['Khóa / mở khóa huấn luyện y tế', 'n', 'n', 'y', 'n', 'n', 'Xem'],
  ['Đề xuất thi đấu', 'Xem', 'y', 'Khám', 'n', 'n', 'Xác nhận'],
  ['Xem hóa đơn', 'y', 'n', 'n', 'n', 'n', 'y'],
  ['Thanh toán VNPay', 'n', 'n', 'n', 'n', 'n', 'y'],
  ['Đình chỉ · kích hoạt lại dịch vụ', 'y', 'n', 'n', 'n', 'n', 'n'],
];
const COLS: Role[] = ['ClubManager', 'HeadTrainer', 'Veterinarian', 'WarehouseManager', 'Groom', 'HorseOwner'];

/** 5.3 — read-only permission matrix (least privilege). */
export const RbacMatrix: React.FC = () => (
  <Panel title="Ma trận quyền theo vai trò" sub="Nguyên tắc quyền tối thiểu. “Xem” là quyền giám sát, không chỉnh sửa chuyên môn."
    foot={<><span>Bác sĩ thú y là người duy nhất mở khóa y tế (BR_01).</span><span>Nguồn: Đặc tả nghiệp vụ §4</span></>}>
    <table className="ht-table">
      <thead><tr><th>Chức năng</th>{COLS.map((r) => <th key={r} style={{ textAlign: 'center' }}>{ROLE_LABEL[r]}</th>)}</tr></thead>
      <tbody>
        {RBAC.map(([fn, ...cells]) => (
          <tr key={fn}>
            <td className="strong">{fn}</td>
            {cells.map((c, i) => (
              <td key={i} style={{ textAlign: 'center' }}>
                {c === 'y' ? <span aria-label="Có quyền" style={{ color: 'var(--success-ink)' }}><Icon name="check" /></span>
                  : c === 'n' ? <span aria-label="Không" style={{ color: 'var(--subtle)' }}>—</span>
                  : <span style={{ color: 'var(--info-ink)', fontSize: 12, fontWeight: 600 }}>{c}</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </Panel>
);
