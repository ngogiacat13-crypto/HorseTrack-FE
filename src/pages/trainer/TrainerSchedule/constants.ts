/* Week of the demo clock (Mon 28/09 → Sun 04/10/2026). */
export const WEEK = [
  ['T2', '28/09/2026'], ['T3', '29/09/2026'], ['T4', '30/09/2026'], ['T5', '01/10/2026'],
  ['T6', '02/10/2026'], ['T7', '03/10/2026'], ['CN', '04/10/2026'],
] as const;
export const TODAY = '03/10/2026';
/* New sessions can be planned from today forward. */
export const ASSIGN_DAYS = [['T7', '03/10/2026'], ['CN', '04/10/2026'], ['T2', '05/10/2026'], ['T3', '06/10/2026']] as const;
/* What the Mã phu has to record during the session. */
export const METRICS = ['Nhịp tim (bpm)', 'Tốc độ (km/h)', 'Quãng đường (m)', 'Thời gian hồi phục'];
