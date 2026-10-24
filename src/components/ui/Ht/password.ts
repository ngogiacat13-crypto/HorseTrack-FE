export const PASSWORD_RE = /^(?=.*\p{L})(?=.*\d)\S{8,64}$/u;
export const PASSWORD_RULE = 'Mật khẩu phải dài 8–64 ký tự, có ít nhất 1 chữ cái và 1 chữ số, không chứa khoảng trắng';
export const USERNAME_RE = /^[A-Za-z0-9._]{4,30}$/;
export const USERNAME_RULE = 'Tên đăng nhập dài 4–30 ký tự, chỉ gồm chữ không dấu, chữ số, dấu chấm (.) và gạch dưới (_)';
export const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
export const PHONE_RULE = 'Số điện thoại di động Việt Nam gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09 (vd 0912345678)';
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export const EMAIL_RULE = 'Email không hợp lệ (vd ten@gmail.com)';
export const normalizePhone = (v: string) => v.replace(/[\s.-]/g, '');

export const scorePassword = (v: string): 0 | 1 | 2 | 3 | 4 => {
  if (!v) return 0;
  if (v.length < 8) return 1;
  let s = 1;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return Math.min(s, 4) as 1 | 2 | 3 | 4;
};
