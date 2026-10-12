import { http } from './http';
import type { AuthUser, Role } from './mockData';

/* Auth against json-server's /users collection.
   DEMO ONLY: passwords are stored in plain text in db.json. A real backend must hash them and issue tokens. */
interface UserRecord {
  id: string;
  username: string;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  role: Role;
  status?: 'ACTIVE' | 'LOCKED';
  lockReason?: string;
}

const toAuthUser = ({ password: _pw, ...u }: UserRecord): AuthUser => ({
  userId: u.id,
  id: u.id,
  username: u.username,
  fullname: u.fullname,
  name: u.fullname,
  email: u.email,
  phone: u.phone,
  role: u.role,
  avatar: u.fullname.charAt(0).toUpperCase(),
});

const findBy = async (field: 'username' | 'email' | 'phone', value: string) => {
  const { data } = await http.get<UserRecord[]>('/users', { params: { [field]: value } });
  return data[0];
};

const findByLogin = async (login: string) =>
  (await findBy('username', login)) ?? (await findBy('email', login)) ?? (await findBy('phone', login));

export const authApi = {
  /** Login by username, email or phone. */
  async login(login: string, password: string): Promise<AuthUser> {
    const user = await findByLogin(login);
    if (!user || user.password !== password) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng!');
    if (user.status === 'LOCKED') throw new Error(`Tài khoản đã bị khóa${user.lockReason ? `: ${user.lockReason}` : ''}. Liên hệ Quản lý CLB.`);
    return toAuthUser(user);
  },

  /** Register a HorseOwner account (default role). Throws { field, message } on duplicates. */
  async register(payload: { username: string; password: string; fullname: string; email: string; phone: string }): Promise<AuthUser> {
    const [dupEmail, dupPhone, dupUsername] = await Promise.all([
      findBy('email', payload.email),
      findBy('phone', payload.phone),
      findBy('username', payload.username),
    ]);
    const duplicateFields: Record<string, string> = {};
    if (dupEmail) duplicateFields.email = 'Email này đã được đăng ký.';
    if (dupPhone) duplicateFields.phone = 'Số điện thoại này đã được đăng ký.';
    if (dupUsername) duplicateFields.username = 'Tên đăng nhập đã tồn tại.';
    if (Object.keys(duplicateFields).length > 0) throw { fields: duplicateFields };
    const { data } = await http.post<UserRecord>('/users', {
      ...payload,
      role: 'HorseOwner',
      status: 'ACTIVE',
      lastLogin: '—',
      horsesOwned: 0,
    });
    return toAuthUser(data);
  },

  /** Demo: no real OTP is sent; only checks that the account exists. */
  async sendOtp(contact: string): Promise<void> {
    const user = (await findBy('email', contact)) ?? (await findBy('phone', contact));
    if (!user) throw new Error('Không tìm thấy tài khoản với email / số điện thoại này.');
  },

  async resetPassword(contact: string, otp: string, newPassword: string): Promise<void> {
    if (otp !== '123456') throw new Error('Mã OTP không đúng. Vui lòng thử lại với 123456.');
    const user = (await findBy('email', contact)) ?? (await findBy('phone', contact));
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    await http.patch(`/users/${user.id}`, { password: newPassword });
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const { data: user } = await http.get<UserRecord>(`/users/${userId}`);
    if (user.password !== oldPassword) throw new Error('Mật khẩu hiện tại không đúng.');
    await http.patch(`/users/${userId}`, { password: newPassword });
  },
};
