import { be, beData } from '../../api/beClient';
import { http } from '../../api/http';
import { invalidate } from '../../api/hybridAdapter';

export interface GenerateResult { billingMonth: string; created: number; skippedExisting: number; skippedZero: number; invoiceCodes: string[] }
export interface FeeStall { id: string; beId: number; zone: string; horse: string | null }

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const previousMonth = (today = new Date()) => {
  const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const billingApi = {
  async generateInvoices(billingMonth: string) {
    if (!MONTH.test(billingMonth)) throw new Error('Chọn kỳ hóa đơn (tháng/năm).');
    const result = await beData<GenerateResult>(be.post('/billing/invoices/generate', undefined, { params: { billingMonth } }));
    invalidate('invoices', 'auditLogs');
    return result;
  },

  async cancelInvoice(invoiceBeId: number, reason: string) {
    const text = reason.trim();
    if (text.length < 10 || text.length > 255) throw new Error('Lý do hủy từ 10 đến 255 ký tự.');
    await be.put(`/billing/invoices/${invoiceBeId}/cancel`, { reason: text });
    invalidate('invoices', 'auditLogs');
  },

  async listStalls() {
    const { data } = await http.get<FeeStall[]>('/stalls');
    return data.filter((s) => s.beId);
  },

  async setStallFee(stallBeId: number, monthlyBaseFee: number) {
    if (!Number.isInteger(monthlyBaseFee) || monthlyBaseFee < 0) throw new Error('Phí lưu chuồng là số nguyên VND, không âm.');
    await be.put(`/billing/stalls/${stallBeId}/monthly-fee`, { monthlyBaseFee });
  },
};
