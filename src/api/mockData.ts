// ====================== AUTH TYPES & MOCK API ======================
export type Role =
  | 'ClubManager'
  | 'HeadTrainer'
  | 'Veterinarian'
  | 'Groom'
  | 'HorseOwner'
  | 'WarehouseManager';

export type HealthStatus = 'Healthy' | 'UnderObservation' | 'Injured' | 'Quarantined';

export const ROLE_LABELS: Record<Role, string> = {
  ClubManager: 'Quản lý CLB',
  HeadTrainer: 'HLV trưởng',
  Veterinarian: 'Bác sĩ thú y',
  Groom: 'Nhân viên chăm ngựa',
  HorseOwner: 'Chủ ngựa',
  WarehouseManager: 'Quản lý kho',
};

export const ROLE_HOME: Record<Role, string> = {
  ClubManager: '/manager',
  HeadTrainer: '/trainer',
  Veterinarian: '/vet',
  Groom: '/groom',
  HorseOwner: '/owner',
  WarehouseManager: '/warehouse',
};

export interface AuthUser {
  userId: string;
  id?: string;
  username: string;
  fullname: string;
  name?: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
}

// --- Giả lập Database người dùng đã đăng ký ---
const MOCK_USERS: (AuthUser & { password: string })[] = [
  // ==================== 1. CLUB MANAGER (Quản lý CLB) ====================
  {
    userId: '1',
    username: 'admin',
    password: 'password123',
    fullname: 'Nguyễn Văn Minh',
    email: 'minh@horsetrack.vn',
    phone: '0901234567',
    role: 'ClubManager',
  },
  
  // ==================== 2. HEAD TRAINER (HLV Trưởng) ====================
  {
    userId: '2',
    username: 'duchung',
    password: 'password123',
    fullname: 'Trần Đức Hùng',
    email: 'hung@horsetrack.vn',
    phone: '0912345678',
    role: 'HeadTrainer',
  },
  
  // ==================== 3. VETERINARIAN (Bác sĩ Thú y) ====================
  {
    userId: '3',
    username: 'thihuong',
    password: 'password123',
    fullname: 'Lê Thị Hương',
    email: 'huong@horsetrack.vn',
    phone: '0923456789',
    role: 'Veterinarian',
  },
  
  // ==================== 4. GROOM (Người chăm ngựa) ====================
  {
    userId: '4',
    username: 'vantoan',
    password: 'password123',
    fullname: 'Phạm Văn Toàn',
    email: 'toan@horsetrack.vn',
    phone: '0934567890',
    role: 'Groom',
  },
  
  // ==================== 5. HORSE OWNER (Chủ ngựa) ====================
  {
    userId: '5',
    username: 'hoanglan',
    password: 'password123',
    fullname: 'Hoàng Thị Lan',
    email: 'lan@horsetrack.vn',
    phone: '0945678901',
    role: 'HorseOwner',
  },
  
  // ==================== 6. WAREHOUSE MANAGER (Quản lý kho) ====================
  {
    userId: '6',
    username: 'vankho',
    password: 'password123',
    fullname: 'Trần Văn Kho',
    email: 'kho@horsetrack.vn',
    phone: '0956789012',
    role: 'WarehouseManager',
  },
];

// --- Hàm giả lập gọi API Backend ---
export const authApi = {
  /**
   * Đăng nhập: backend tự nhận diện role dựa trên username
   */
  async login(username: string, password: string): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 800));
    const user = MOCK_USERS.find(
      (u) =>
        (u.username === username || u.email === username || u.phone === username) &&
        u.password === password
    );
    if (!user) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng!');
    const { password: _pw, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Đăng ký: kiểm tra trùng email/phone, mặc định role là HorseOwner
   */
  async register(payload: {
    username: string; password: string; fullname: string; email: string; phone: string;
  }): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 1000));

    // Kiểm tra trùng
    const dupEmail = MOCK_USERS.find((u) => u.email === payload.email);
    const dupPhone = MOCK_USERS.find((u) => u.phone === payload.phone);
    const dupUsername = MOCK_USERS.find((u) => u.username === payload.username);

    if (dupEmail) throw { field: 'email', message: 'Email này đã được đăng ký.' };
    if (dupPhone) throw { field: 'phone', message: 'Số điện thoại này đã được đăng ký.' };
    if (dupUsername) throw { field: 'username', message: 'Tên đăng nhập đã tồn tại.' };

    const newUser: AuthUser & { password: string } = {
      userId: String(MOCK_USERS.length + 1),
      id: String(MOCK_USERS.length + 1),
      username: payload.username,
      password: payload.password,
      fullname: payload.fullname,
      name: payload.fullname,
      email: payload.email,
      phone: payload.phone,
      role: 'HorseOwner',
      avatar: payload.fullname.charAt(0).toUpperCase(),
    };
    MOCK_USERS.push(newUser);
    const { password: _pw, ...safeUser } = newUser;
    return safeUser;
  },

  /**
   * Gửi OTP (giả lập)
   */
  async sendOtp(contact: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 800));
    // Backend thật sẽ gửi OTP đến email/sđt. Ở đây chỉ giả lập.
  },

  /**
   * Đặt lại mật khẩu bằng OTP
   */
  async resetPassword(contact: string, otp: string, newPassword: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000));
    if (otp !== '123456') throw new Error('Mã OTP không đúng. Vui lòng thử lại với 123456.');
    const user = MOCK_USERS.find((u) => u.email === contact || u.phone === contact);
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    user.password = newPassword;
  },

  /**
   * Đổi mật khẩu khi đã đăng nhập
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000));
    const user = MOCK_USERS.find((u) => u.userId === userId);
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    if (user.password !== oldPassword) throw new Error('Mật khẩu hiện tại không đúng.');
    user.password = newPassword;
  },
};

export interface HorseRegistrationRecord {
  horseId: string;
  horseName: string;
  dob: string;
  gender: 'Colt' | 'Filly' | 'Stallion' | 'Mare' | 'Gelding';
  breed: string;
  pedigree: string;
  weightKg: number;
  healthStatus: 'Healthy' | 'Need_Check' | 'Injured' | 'Isolated';
  isLocked: false;
  prizeSharePct: number;
  ownerId: string;
  stallId: number | null;
  createdAt: string;
  registrationStatus: 'Registered';
}

export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: string;
  healthStatus: HealthStatus;
  isLocked: boolean;
  ownerName: string;
  trainerPlan?: string;
}

export interface Task {
  id: string;
  title: string;
  horseName: string;
  time: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  type: string;
  description: string;
}

export interface Invoice {
  id: string;
  horseName: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export const MOCK_HORSES: Horse[] = [
  { id: 'h1', name: 'Galaxy', breed: 'Thoroughbred', age: '4 tuổi', gender: 'Đực', healthStatus: 'Healthy', isLocked: false, ownerName: 'Hoàng Thị Lan', trainerPlan: 'Sức bền - Giai đoạn 2' },
  { id: 'h2', name: 'Storm', breed: 'Arabian', age: '3 tuổi', gender: 'Cái', healthStatus: 'Injured', isLocked: true, ownerName: 'Đỗ Minh Quân' },
  { id: 'h3', name: 'Bolt', breed: 'Quarter Horse', age: '5 tuổi', gender: 'Đực', healthStatus: 'Healthy', isLocked: false, ownerName: 'Vũ Thị Mai', trainerPlan: 'Tốc độ - Giai đoạn 1' },
  { id: 'h4', name: 'Thunder', breed: 'Thoroughbred', age: '4 tuổi', gender: 'Đực', healthStatus: 'UnderObservation', isLocked: false, ownerName: 'Hoàng Thị Lan' },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Cho ăn sáng', horseName: 'Galaxy', time: '06:00', status: 'Overdue', type: 'Feeding', description: '3kg cám + 2kg cỏ' },
  { id: 't2', title: 'Dọn chuồng', horseName: 'Storm', time: '07:00', status: 'Pending', type: 'MuckingOut', description: 'Vệ sinh toàn bộ chuồng A-03' },
  { id: 't3', title: 'Chải lông', horseName: 'Bolt', time: '06:30', status: 'Completed', type: 'Grooming', description: 'Chải lông và kiểm tra móng' },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-0042', horseName: 'Galaxy', amount: 15000000, dueDate: '10/09/2026', status: 'Overdue' },
  { id: 'INV-0043', horseName: 'Storm', amount: 6000000, dueDate: '15/10/2026', status: 'Pending' },
  { id: 'INV-0041', horseName: 'Bolt', amount: 12500000, dueDate: '01/09/2026', status: 'Paid' },
];