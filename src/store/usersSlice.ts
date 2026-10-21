import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Actor, ManagedUser, managerApi, UserRole } from '../api/managerApi';

interface UsersState {
  items: ManagedUser[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  saving: boolean;
}

const initialState: UsersState = { items: [], status: 'idle', error: null, saving: false };

export const fetchUsers = createAsyncThunk('users/fetchAll', () => managerApi.getUsers());
export const changeRole = createAsyncThunk('users/changeRole', (a: { user: ManagedUser; role: UserRole; reason: string; actor: Actor }) =>
  managerApi.changeRole(a.user, a.role, a.reason, a.actor));
export const lockUser = createAsyncThunk('users/lock', (a: { user: ManagedUser; reason: string; actor: Actor }) =>
  managerApi.lockUser(a.user, a.reason, a.actor));
export const unlockUser = createAsyncThunk('users/unlock', (a: { user: ManagedUser; reason: string; actor: Actor }) =>
  managerApi.unlockUser(a.user, a.reason, a.actor));

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message ?? 'Lỗi tải người dùng'; });

    for (const thunk of [changeRole, lockUser, unlockUser]) {
      builder
        .addCase(thunk.pending, (state) => { state.saving = true; })
        .addCase(thunk.fulfilled, (state, action) => {
          state.saving = false;
          state.items = state.items.map((u) => (u.id === action.payload.id ? action.payload : u));
        })
        .addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.error.message ?? 'Lưu thất bại'; });
    }
  },
});

export default usersSlice.reducer;
