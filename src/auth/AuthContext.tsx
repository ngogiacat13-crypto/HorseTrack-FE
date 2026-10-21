import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AuthUser } from '../api/mockData';
import { authApi } from '../api/authApi';
import { setSessionExpiredHandler } from '../api/beClient';

const STORAGE_KEY = 'horsetrack_user';

type AuthState = { user: AuthUser | null };
type AuthAction = { type: 'LOGIN'; user: AuthUser } | { type: 'UPDATE'; patch: Partial<AuthUser> } | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.user };
    case 'UPDATE':
      return state.user ? { user: { ...state.user, ...action.patch } } : state;
    case 'LOGOUT':
      return { user: null };
    default:
      return state;
  }
}

function restore(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return { user: stored ? (JSON.parse(stored) as AuthUser) : null };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { user: null };
  }
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, undefined, restore);

  const login = useCallback(async (username: string, password: string) => {
    const u = await authApi.login(username, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    dispatch({ type: 'LOGIN', user: u });
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'LOGOUT' });
    void authApi.logout();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: 'LOGOUT' });
    });
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    dispatch({ type: 'UPDATE', patch });
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...JSON.parse(stored), ...patch }));
    } catch {}
  }, []);

  const value = useMemo(() => ({ user: state.user, login, logout, updateUser }), [state.user, login, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const useActor = () => {
  const { user } = useAuth();
  return useMemo(() => ({ id: user?.userId, name: user?.fullname ?? 'Không rõ', role: user?.role ?? 'Unknown' }), [user]);
};
