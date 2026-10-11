import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Actor, Invoice, managerApi } from '../api/managerApi';

interface InvoicesState {
  items: Invoice[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  saving: boolean;
}

const initialState: InvoicesState = { items: [], status: 'idle', error: null, saving: false };

export const fetchInvoices = createAsyncThunk('invoices/fetchAll', () => managerApi.getInvoices());
export const suspendService = createAsyncThunk('invoices/suspend', (a: { inv: Invoice; reason: string; actor: Actor }) =>
  managerApi.suspendService(a.inv, a.reason, a.actor));
export const reactivateService = createAsyncThunk('invoices/reactivate', (a: { inv: Invoice; actor: Actor }) =>
  managerApi.reactivateService(a.inv, a.actor));
export const sendReminder = createAsyncThunk('invoices/remind', (a: { inv: Invoice; actor: Actor }) =>
  managerApi.sendReminder(a.inv, a.actor));

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const saved = (state: InvoicesState, inv: Invoice) => {
      state.saving = false;
      state.items = state.items.map((x) => (x.id === inv.id ? inv : x));
    };
    builder
      .addCase(fetchInvoices.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchInvoices.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchInvoices.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message ?? 'Lỗi tải hóa đơn'; })
      .addCase(suspendService.pending, (state) => { state.saving = true; })
      .addCase(suspendService.fulfilled, (state, action) => saved(state, action.payload))
      .addCase(suspendService.rejected, (state, action) => { state.saving = false; state.error = action.error.message ?? 'Đình chỉ thất bại'; })
      .addCase(reactivateService.pending, (state) => { state.saving = true; })
      .addCase(reactivateService.fulfilled, (state, action) => saved(state, action.payload))
      .addCase(reactivateService.rejected, (state, action) => { state.saving = false; state.error = action.error.message ?? 'Kích hoạt lại thất bại'; });
  },
});

export default invoicesSlice.reducer;
