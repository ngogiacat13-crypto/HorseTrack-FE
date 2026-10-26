import { USE_BACKEND, be, beData } from '../../api/beClient';

export type EmailStatus = 'SENT' | 'FAILED' | 'SKIPPED';
export interface EmailLog { id: number; to: string; userName: string; purpose: string; subject: string; status: EmailStatus; error: string; sentAt: string }
export interface EmailLogFilter { status: '' | EmailStatus; purpose: string; toEmail: string; fromDate: string; toDate: string; page: number }
export interface EmailLogPage { items: EmailLog[]; total: number; pages: number; page: number }

interface BeEmailLog { logId: number; toEmail: string; userId?: number | null; userFullName?: string | null; purpose: string; subject: string; status: string; error?: string | null; sentAt: string }
interface BePage<T> { content: T[]; totalElements: number; totalPages: number; number: number }

export const PAGE_SIZE = 20;
export const EMPTY_FILTER: EmailLogFilter = { status: '', purpose: '', toEmail: '', fromDate: '', toDate: '', page: 0 };
export const PURPOSE_LABEL: Record<string, string> = {
  OTP: 'Mã OTP', STAFF_ACCOUNT: 'Tài khoản nhân viên', INVOICE: 'Hóa đơn', BILLING: 'Thanh toán / dịch vụ',
  TRAINER_ASSIGNMENT: 'Phân công HLV', GROOM_ZONE: 'Phân khu Mã phu', CARE_TASK_OVERDUE: 'Việc chăm sóc quá hạn',
  NUTRITION: 'Dinh dưỡng', RACE_PROPOSAL: 'Đề xuất thi đấu', TRAINING_INCIDENT: 'Sự cố buổi tập', TRAINING_PAUSE: 'Tạm dừng buổi tập',
  VET_LOCK: 'Khóa huấn luyện', GENERAL: 'Khác',
};
export const STATUS_LABEL: Record<EmailStatus, [string, 'success' | 'danger' | 'neutral']> = {
  SENT: ['Đã gửi', 'success'], FAILED: ['Gửi lỗi', 'danger'], SKIPPED: ['Chưa gửi (chế độ dev)', 'neutral'],
};

const stamp = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const emailLogsApi = {
  async list(f: EmailLogFilter): Promise<EmailLogPage> {
    if (!USE_BACKEND) return { items: [], total: 0, pages: 0, page: 0 };
    const params = {
      page: f.page, size: PAGE_SIZE,
      status: f.status || undefined, purpose: f.purpose || undefined, toEmail: f.toEmail.trim() || undefined,
      fromDate: f.fromDate || undefined, toDate: f.toDate || undefined,
    };
    const res = await beData<BePage<BeEmailLog>>(be.get('/email-logs', { params }));
    return {
      items: res.content.map((l) => ({
        id: l.logId, to: l.toEmail, userName: l.userFullName ?? '—', purpose: l.purpose, subject: l.subject,
        status: (['SENT', 'FAILED', 'SKIPPED'].includes(l.status) ? l.status : 'FAILED') as EmailStatus, error: l.error ?? '', sentAt: stamp(l.sentAt),
      })),
      total: res.totalElements, pages: res.totalPages, page: res.number,
    };
  },
};
