import { http } from './http';
import type { AuthUser, Role } from './mockData';
import { USE_BACKEND, be, beData, tokenStore, type Tokens } from './beClient';

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
  avatarUrl?: string | null;
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
  avatarUrl: u.avatarUrl ?? undefined,
});

const findBy = async (field: 'username' | 'email' | 'phone', value: string) => {
  const { data } = await http.get<UserRecord[]>('/users', { params: { [field]: value } });
  return data[0];
};

const findByLogin = async (login: string) =>
  (await findBy('username', login)) ?? (await findBy('email', login)) ?? (await findBy('phone', login));

/* ---------- real backend (npm run dev:be) ---------- */
interface BeLogin extends Tokens {
  role: string;
  userId: number;
}
interface BeProfile {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string | null;
  roleName: string;
  isActive?: boolean;
}

/* Users.role_name in the database → role used by the screens. 'Trainer' has no own screens: it uses the Head Trainer ones. */
const BE_ROLE: Record<string, Role> = {
  'Club Manager': 'ClubManager',
  'Head Trainer': 'HeadTrainer',
  Trainer: 'HeadTrainer',
  Veterinarian: 'Veterinarian',
  Groom: 'Groom',
  'Horse Owner': 'HorseOwner',
  'Warehouse Manager': 'WarehouseManager',
};

const fromProfile = (p: BeProfile, avatarUrl?: string): AuthUser => ({
  userId: String(p.userId),
  id: String(p.userId),
  username: p.username,
  fullname: p.fullName,
  name: p.fullName,
  email: p.email,
  phone: p.phone ?? '',
  role: BE_ROLE[p.roleName] ?? (p.roleName as Role),
  avatar: p.fullName.charAt(0).toUpperCase(),
  avatarUrl,
});

const beAuth = {
  /** POST /auth/login → keep the tokens → GET /account/my-profile with the Bearer token. */
  async login(username: string, password: string): Promise<AuthUser> {
    const t = await beData<BeLogin>(be.post('/auth/login', { username, password }));
    tokenStore.set({ accessToken: t.accessToken, refreshToken: t.refreshToken });
    try {
      const profile = await beData<BeProfile>(be.get('/account/my-profile'));
      if (!BE_ROLE[profile.roleName]) throw new Error(`Vai trò “${profile.roleName}” chưa có màn hình trên hệ thống.`);
      return fromProfile(profile);
    } catch (e) {
      tokenStore.clear();
      throw e;
    }
  },

  async logout(): Promise<void> {
    const t = tokenStore.get();
    tokenStore.clear();
    if (!t?.refreshToken) return;
    await be.post('/auth/logout', { refreshToken: t.refreshToken }, { headers: { Authorization: `Bearer ${t.accessToken}` } }).catch(() => {});
  },

  async register(p: { username: string; password: string; fullname: string; email: string; phone: string; taxCode?: string; billingAddress?: string }): Promise<void> {
    await be.post('/auth/register-owner', {
      username: p.username,
      password: p.password,
      fullName: p.fullname,
      email: p.email,
      phone: p.phone,
      taxCode: p.taxCode,
      billingAddress: p.billingAddress,
    });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await be.put('/account/change-password', { oldPassword, newPassword, confirmNewPassword: newPassword });
  },
};

const NO_BE_API = 'Backend chưa có API cho chức năng này.';

export const authApi = {
  /** Login by username, email or phone (backend: username only). */
  async login(login: string, password: string): Promise<AuthUser> {
    if (USE_BACKEND) return beAuth.login(login, password);
    const user = await findByLogin(login);
    if (!user || user.password !== password) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng!');
    if (user.status === 'LOCKED') throw new Error(`Tài khoản đã bị khóa${user.lockReason ? `: ${user.lockReason}` : ''}. Liên hệ Quản lý CLB.`);
    return toAuthUser(user);
  },

  /** Register a HorseOwner account (default role). Throws { field, message } on duplicates. */
  /** Sign out on the backend too (revokes the refresh token). Mock mode: nothing to do. */
  async logout(): Promise<void> {
    if (USE_BACKEND) await beAuth.logout();
  },

  async register(payload: { username: string; password: string; fullname: string; email: string; phone: string; taxCode?: string; billingAddress?: string }): Promise<AuthUser | null> {
    if (USE_BACKEND) {
      await beAuth.register(payload);
      return null;
    }
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
    if (USE_BACKEND) throw new Error(NO_BE_API);
    const user = (await findBy('email', contact)) ?? (await findBy('phone', contact));
    if (!user) throw new Error('Không tìm thấy tài khoản với email / số điện thoại này.');
  },

  async resetPassword(contact: string, otp: string, newPassword: string): Promise<void> {
    if (USE_BACKEND) throw new Error(NO_BE_API);
    if (otp !== '123456') throw new Error('Mã OTP không đúng. Vui lòng thử lại với 123456.');
    const user = (await findBy('email', contact)) ?? (await findBy('phone', contact));
    if (!user) throw new Error('Không tìm thấy tài khoản.');
    if (user.password === newPassword) throw new Error('Mật khẩu mới không được trùng mật khẩu cũ.');
    await http.patch(`/users/${user.id}`, { password: newPassword });
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (USE_BACKEND) return beAuth.changePassword(oldPassword, newPassword);
    const { data: user } = await http.get<UserRecord>(`/users/${userId}`);
    if (user.password !== oldPassword) throw new Error('Mật khẩu hiện tại không đúng.');
    if (user.password === newPassword) throw new Error('Mật khẩu mới không được trùng mật khẩu cũ.');
    await http.patch(`/users/${userId}`, { password: newPassword });
  },

  /** Set or remove (null) the profile picture of the signed-in user. */
  async updateAvatar(userId: string, avatarUrl: string | null): Promise<AuthUser> {
    if (avatarUrl && !/^data:image\/(png|jpeg|webp);base64,/.test(avatarUrl)) throw new Error('Ảnh đại diện không hợp lệ.');
    if (avatarUrl && avatarUrl.length > 400_000) throw new Error('Ảnh quá lớn sau khi nén — hãy chọn ảnh khác.');
    // Backend has no avatar column yet: keep the picture in this browser only.
    if (USE_BACKEND) return fromProfile(await beData<BeProfile>(be.get('/account/my-profile')), avatarUrl ?? undefined);
    const { data } = await http.patch<UserRecord>(`/users/${userId}`, { avatarUrl });
    return toAuthUser(data);
  },
};
