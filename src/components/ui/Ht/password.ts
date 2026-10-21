export const PASSWORD_RE = /^(?=.*\p{L})(?=.*\d)\S{8,64}$/u;
export const PASSWORD_RULE = 'Mật khẩu phải dài 8–64 ký tự, có ít nhất 1 chữ cái và 1 chữ số, không chứa khoảng trắng';
export const USERNAME_RE = /^[A-Za-z0-9._]{4,30}$/;
export const USERNAME_RULE = 'Tên đăng nhập dài 4–30 ký tự, chỉ gồm chữ không dấu, chữ số, dấu chấm (.) và gạch dưới (_)';

export const scorePassword = (v: string): 0 | 1 | 2 | 3 | 4 => {
  if (!v) return 0;
  if (v.length < 8) return 1;
  let s = 1;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return Math.min(s, 4) as 1 | 2 | 3 | 4;
};
