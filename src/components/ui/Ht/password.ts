/* ---------- Password strength ---------- */
export const scorePassword = (v: string): 0 | 1 | 2 | 3 | 4 => {
  if (!v) return 0;
  if (v.length < 8) return 1;
  let s = 1;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return Math.min(s, 4) as 1 | 2 | 3 | 4;
};
