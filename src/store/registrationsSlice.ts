import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Actor, ChecklistItem, managerApi, Registration } from '../api/managerApi';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface RegistrationsState {
  items: Registration[];
  status: Status;
  error: string | null;
  current: Registration | null;
  currentStatus: Status;
  saving: boolean;
}

const initialState: RegistrationsState = { items: [], status: 'idle', error: null, current: null, currentStatus: 'idle', saving: false };

/* Thunks (redux-thunk is built into configureStore): async work, then the slice reacts to pending/fulfilled/rejected. */
export const fetchRegistrations = createAsyncThunk('registrations/fetchAll', () => managerApi.getRegistrations());
export const fetchRegistration = createAsyncThunk('registrations/fetchOne', (id: string) => managerApi.getRegistration(id));

export const approveRegistration = createAsyncThunk(
  'registrations/approve',
  (a: { reg: Registration; checklist: ChecklistItem[]; note: string; actor: Actor }) =>
    managerApi.approveRegistration(a.reg, a.checklist, a.note, a.actor),
);

export const rejectRegistration = createAsyncThunk(
  'registrations/reject',
  (a: { reg: Registration; checklist: ChecklistItem[]; reason: string; allowResubmit: boolean; actor: Actor }) =>
    managerApi.rejectRegistration(a.reg, a.checklist, a.reason, a.allowResubmit, a.actor),
);

const replace = (state: RegistrationsState, reg: Registration) => {
  state.items = state.items.map((r) => (r.id === reg.id ? reg : r));
  if (state.current?.id === reg.id) state.current = reg;
};

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegistrations.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchRegistrations.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchRegistrations.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message ?? 'Lỗi tải dữ liệu'; })

      .addCase(fetchRegistration.pending, (state) => { state.currentStatus = 'loading'; state.error = null; })
      .addCase(fetchRegistration.fulfilled, (state, action) => { state.currentStatus = 'succeeded'; state.current = action.payload; })
      .addCase(fetchRegistration.rejected, (state, action) => { state.currentStatus = 'failed'; state.error = action.error.message ?? 'Lỗi tải hồ sơ'; })

      .addCase(approveRegistration.pending, (state) => { state.saving = true; })
      .addCase(approveRegistration.fulfilled, (state, action) => { state.saving = false; replace(state, action.payload); })
      .addCase(approveRegistration.rejected, (state, action) => { state.saving = false; state.error = action.error.message ?? 'Phê duyệt thất bại'; })

      .addCase(rejectRegistration.pending, (state) => { state.saving = true; })
      .addCase(rejectRegistration.fulfilled, (state, action) => { state.saving = false; replace(state, action.payload); })
      .addCase(rejectRegistration.rejected, (state, action) => { state.saving = false; state.error = action.error.message ?? 'Từ chối thất bại'; });
  },
});

export default registrationsSlice.reducer;
