// ==================== MOCK API CHO MANAGER ====================
export interface ManagerDashboard {
  greeting: { message: string; date: string; weekday: string; managerName: string };
  kpi: {
    totalHorses: { value: number; trend: string; trendType: 'up' | 'down' | 'neutral' | 'danger' };
    pendingRegistrations: { value: number; trend: string; trendType: 'up' | 'down' | 'neutral' | 'danger' };
    pendingProtocols: { value: number; trend: string; trendType: 'up' | 'down' | 'neutral' | 'danger' };
    overdueTasks: { value: number; trend: string; trendType: 'up' | 'down' | 'neutral' | 'danger' };
  };
  recentRegistrations: any[];
  overdueInvoices: any[];
  todaySessions: any[];
  overdueTasks: any[];
  monthlyCosts: { total: number; trend: string; chart: { month: string; value: number }[] };
  systemLogs: { id: number; type: string; message: string; timestamp: string }[];
}

export interface Registration {
  id: string;
  type: string;
  horse: { id: number; code: string; name: string; breed: string; age: number; gender: string; avatar: string };
  owner: { id: number; fullName: string; email: string; phone: string };
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  priority: 'Normal' | 'High';
  hasAttachments: boolean;
  attachmentCount: number;
}

export interface RegistrationDetail extends Registration {
  submittedBy: {
    userId: number; fullName: string; email: string; phone: string; taxCode: string; billingAddress: string;
  };
  horse: Registration['horse'] & {
    color: string; height: string; weight: number; microchipId: string;
    passportNumber: string; healthCertificate: any; ownershipDocument: any;
  };
  validationChecklist: { key: string; label: string; passed: boolean; reason?: string }[];
  attachments: { name: string; url: string; uploadedAt: string }[];
  auditTrail: { action: string; by: string; at: string }[];
}

export interface Protocol {
  id: string;
  status: 'PENDING_STOCK' | 'WAITING_SHIPMENT' | 'READY_TO_APPROVE' | 'APPROVED' | 'REJECTED';
  horse: { id: number; name: string; avatar: string; breed: string };
  vet: { id: number; fullName: string };
  case: { id: string; diagnosis: string };
  phases: number;
  totalCost: number;
  createdAt: string;
  stockVerifiedAt?: string;
  stockVerifiedBy?: string;
  warehouseNote?: string;
}

export const managerApi = {
  async getDashboard(): Promise<ManagerDashboard> {
    await new Promise(r => setTimeout(r, 500));
    return {
      greeting: { message: 'Chào buổi sáng', date: '2026-10-03', weekday: 'Thứ Ba', managerName: 'Nguyễn Văn Minh' },
      kpi: {
        totalHorses: { value: 12, trend: '+2 tháng này', trendType: 'up' },
        pendingRegistrations: { value: 3, trend: 'cập nhật 3 ngày', trendType: 'neutral' },
        pendingProtocols: { value: 2, trend: '8,400,000 đ', trendType: 'neutral' },
        overdueTasks: { value: 5, trend: '+3 hôm nay', trendType: 'danger' },
      },
      recentRegistrations: [
        { id: 'REG-0019', horseName: 'Thunder Bay', ownerName: 'Hoàng Thị Lan', submittedAt: '2026-10-01T09:15:00', status: 'Pending' },
        { id: 'REG-0018', horseName: 'Silver Wind', ownerName: 'Đỗ Minh Quân', submittedAt: '2026-09-30T14:30:00', status: 'Pending' },
        { id: 'REG-0017', horseName: 'Red Comet', ownerName: 'Vũ Thị Mai', submittedAt: '2026-09-29T10:00:00', status: 'Approved' },
      ],
      overdueInvoices: [
        { id: 'INV-0042', horseName: 'Galaxy', ownerName: 'Hoàng Thị Lan', overdueDays: 22, amount: 15000000, status: 'Suspended' },
        { id: 'INV-0047', horseName: 'Storm', ownerName: 'Đỗ Minh Quân', overdueDays: 8, amount: 6000000, status: 'Overdue' },
        { id: 'INV-0049', horseName: 'Star', ownerName: 'Vũ Thị Mai', overdueDays: 2, amount: 12500000, status: 'Overdue' },
      ],
      todaySessions: [
        { time: '08:00', horseName: 'Bolt', plan: 'Tốc độ - P1', trainerName: 'Trần Đức Hùng', status: 'Completed', statusLabel: 'Hoàn thành' },
        { time: '10:00', horseName: 'Galaxy', plan: 'Sức bền - P2', trainerName: 'Trần Đức Hùng', status: 'Stopped', statusLabel: 'Dừng — vượt ngưỡng', severity: 'danger' },
      ],
      overdueTasks: [
        { id: 'TASK-008', type: 'Cho ăn sáng', horseName: 'Galaxy', groomName: 'Phạm Văn Toàn', overdueBy: '+52 phút', severity: 'danger' },
      ],
      monthlyCosts: {
        total: 42600000, trend: '+18% so với tháng 8',
        chart: [
          { month: 'T5', value: 5.2 }, { month: 'T6', value: 6.8 }, { month: 'T7', value: 5.9 },
          { month: 'T8', value: 7.4 }, { month: 'T9', value: 7.6 }, { month: 'T10', value: 9.8 },
        ],
      },
      systemLogs: [
        { id: 1, type: 'danger', message: 'Hệ thống dừng phiên S-0023 (Galaxy)', timestamp: '2026-10-03T18:23:00' },
        { id: 2, type: 'warning', message: 'Lê Thị Hương gửi phác đồ PD-0011', timestamp: '2026-10-02T16:48:00' },
        { id: 3, type: 'success', message: 'Nguyễn Văn Minh duyệt hồ sơ REG-0016', timestamp: '2026-09-29T09:12:00' },
      ],
    };
  },

  async getRegistrations(): Promise<Registration[]> {
    await new Promise(r => setTimeout(r, 400));
    return [
      {
        id: 'REG-0019', type: 'HorseRegistration',
        horse: { id: 19, code: 'VN-MC-9019', name: 'Thunder Bay', breed: 'Thoroughbred', age: 3, gender: 'Male', avatar: '' },
        owner: { id: 45, fullName: 'Hoàng Thị Lan', email: 'lan@example.com', phone: '0901234567' },
        submittedAt: '2026-10-01T09:15:00', status: 'Pending', priority: 'Normal', hasAttachments: true, attachmentCount: 3,
      },
      {
        id: 'REG-0018', type: 'HorseRegistration',
        horse: { id: 18, code: 'VN-MC-9018', name: 'Silver Wind', breed: 'Arabian', age: 4, gender: 'Female', avatar: '' },
        owner: { id: 46, fullName: 'Đỗ Minh Quân', email: 'quan@example.com', phone: '0912345678' },
        submittedAt: '2026-09-30T14:30:00', status: 'Pending', priority: 'High', hasAttachments: true, attachmentCount: 2,
      },
      {
        id: 'REG-0017', type: 'HorseRegistration',
        horse: { id: 17, code: 'VN-MC-9017', name: 'Red Comet', breed: 'Thoroughbred', age: 5, gender: 'Male', avatar: '' },
        owner: { id: 47, fullName: 'Vũ Thị Mai', email: 'mai@example.com', phone: '0923456789' },
        submittedAt: '2026-09-29T10:00:00', status: 'Approved', priority: 'Normal', hasAttachments: false, attachmentCount: 0,
      },
    ];
  },

  async getRegistrationDetail(id: string): Promise<RegistrationDetail> {
    await new Promise(r => setTimeout(r, 400));
    return {
      id, type: 'HorseRegistration', status: 'Pending', priority: 'Normal',
      submittedAt: '2026-10-01T09:15:00', hasAttachments: true, attachmentCount: 3,
      submittedBy: { userId: 45, fullName: 'Hoàng Thị Lan', email: 'lan@example.com', phone: '0901234567', taxCode: '0123456789', billingAddress: '123 Lê Lợi, Q.1, TP.HCM' },
      horse: {
        id: 19, code: 'VN-MC-9019', name: 'Thunder Bay', breed: 'Thoroughbred', age: 3, gender: 'Male', avatar: '',
        color: 'Bay', height: '16.2 hands', weight: 480, microchipId: '985141000012345', passportNumber: 'VN-PP-2024-9019',
        healthCertificate: { issuedBy: 'Chi cục Thú y TP.HCM', issueDate: '2026-08-15', expiryDate: '2027-08-15', documentUrl: '#' },
        ownershipDocument: { documentUrl: '#' },
      },
      owner: { id: 45, fullName: 'Hoàng Thị Lan', email: 'lan@example.com', phone: '0901234567' },
      validationChecklist: [
        { key: 'identityVerified', label: 'Đã xác minh danh tính chủ ngựa', passed: true },
        { key: 'healthCertValid', label: 'Giấy chứng nhận sức khỏe còn hiệu lực', passed: true },
        { key: 'microchipRegistered', label: 'Microchip đã đăng ký với cơ quan', passed: true },
        { key: 'ownershipDocProvided', label: 'Đã cung cấp giấy tờ sở hữu', passed: false, reason: 'File PDF bị mờ, không đọc được.' },
      ],
      attachments: [
        { name: 'Giấy chứng nhận sức khỏe', url: '#', uploadedAt: '2026-10-01' },
        { name: 'Giấy tờ sở hữu', url: '#', uploadedAt: '2026-10-01' },
      ],
      auditTrail: [
        { action: 'Created', by: 'Hoàng Thị Lan', at: '2026-10-01T09:15:00' },
      ],
    };
  },

  async approveRegistration(id: string, payload: any): Promise<any> {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, message: `Hồ sơ ${id} đã được phê duyệt.` };
  },

  async rejectRegistration(id: string, payload: any): Promise<any> {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, message: `Đã từ chối hồ sơ ${id}.` };
  },

  async getProtocols(): Promise<Protocol[]> {
    await new Promise(r => setTimeout(r, 400));
    return [
      {
        id: 'PD-0011', status: 'READY_TO_APPROVE',
        horse: { id: 1, name: 'Storm', avatar: '', breed: 'Arabian' },
        vet: { id: 3, fullName: 'Lê Thị Hương' },
        case: { id: 'C-0012', diagnosis: 'Sưng gân gấp chân trước trái' },
        phases: 2, totalCost: 8400000, createdAt: '2026-10-02T16:48:00',
        stockVerifiedAt: '2026-10-05T09:30:00', stockVerifiedBy: 'Trần Văn Kho',
        warehouseNote: 'Đã đủ vật tư sau khi nhập lô hàng SHIP-0023.',
      },
      {
        id: 'PD-0012', status: 'PENDING_STOCK',
        horse: { id: 2, name: 'Bolt', avatar: '', breed: 'Quarter Horse' },
        vet: { id: 3, fullName: 'Lê Thị Hương' },
        case: { id: 'C-0013', diagnosis: 'Viêm khớp nhẹ' },
        phases: 1, totalCost: 2400000, createdAt: '2026-10-06T10:00:00',
      },
    ];
  },

  async approveProtocol(id: string, payload: any): Promise<any> {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, message: `Phác đồ ${id} đã được phê duyệt.` };
  },

  async rejectProtocol(id: string, payload: any): Promise<any> {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, message: `Đã từ chối phác đồ ${id}.` };
  },

  async getInvoices(): Promise<any> {
    await new Promise(r => setTimeout(r, 400));
    return {
      summary: { totalRevenue: 45000000, totalOverdue: 33500000, totalPending: 8000000 },
      items: [
        { id: 'INV-0042', horse: { id: 1, name: 'Galaxy' }, owner: { id: 45, fullName: 'Hoàng Thị Lan' }, period: '09/2026', issueDate: '2026-09-01', dueDate: '2026-09-10', totalAmount: 15000000, paidAmount: 0, status: 'Suspended', overdueDays: 22 },
        { id: 'INV-0047', horse: { id: 2, name: 'Storm' }, owner: { id: 46, fullName: 'Đỗ Minh Quân' }, period: '09/2026', issueDate: '2026-09-01', dueDate: '2026-09-10', totalAmount: 6000000, paidAmount: 0, status: 'Overdue', overdueDays: 8 },
        { id: 'INV-0049', horse: { id: 5, name: 'Star' }, owner: { id: 47, fullName: 'Vũ Thị Mai' }, period: '09/2026', issueDate: '2026-09-01', dueDate: '2026-09-10', totalAmount: 12500000, paidAmount: 0, status: 'Overdue', overdueDays: 2 },
      ],
    };
  },

  async getAuditLogs(): Promise<any> {
    await new Promise(r => setTimeout(r, 400));
    return {
      total: 342,
      items: [
        { logId: 10245, userId: 2, userName: 'Nguyễn Văn Minh', userRole: 'ClubManager', action: 'APPROVE_REGISTRATION', entity: 'Horses', entityId: 19, ipAddress: '192.168.1.15', timestamp: '2026-10-08T11:00:00' },
        { logId: 10244, userId: 3, userName: 'Lê Thị Hương', userRole: 'Veterinarian', action: 'CREATE_PROTOCOL', entity: 'Treatment_Protocols', entityId: 11, ipAddress: '192.168.1.22', timestamp: '2026-10-02T16:48:00' },
        { logId: 10243, userId: 2, userName: 'Nguyễn Văn Minh', userRole: 'ClubManager', action: 'LOGIN', entity: 'Users', entityId: 2, ipAddress: '192.168.1.15', timestamp: '2026-10-08T08:00:00' },
      ],
    };
  },
};
