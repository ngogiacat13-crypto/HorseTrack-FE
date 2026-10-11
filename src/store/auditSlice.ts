import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AuditLog, managerApi } from '../api/managerApi';

interface AuditState {
  items: AuditLog[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuditState = { items: [], status: 'idle', error: null };

export const fetchAuditLogs = createAsyncThunk('audit/fetchAll', () => managerApi.getAuditLogs());

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchAuditLogs.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message ?? 'Lỗi tải nhật ký'; });
  },
});

export default auditSlice.reducer;
