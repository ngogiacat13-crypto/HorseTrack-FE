import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import registrations from './registrationsSlice';
import invoices from './invoicesSlice';
import users from './usersSlice';
import audit from './auditSlice';
import { logger } from './logger';

export const store = configureStore({
  reducer: { registrations, invoices, users, audit },
  middleware: (getDefault) => getDefault().concat(logger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
