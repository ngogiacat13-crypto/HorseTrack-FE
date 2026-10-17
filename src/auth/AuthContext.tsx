import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { AuthUser } from '../api/mockData';
import { authApi } from '../api/authApi';

/* Auth = Context (provider/consumer, Slot 8) + useReducer (Slot 9–10).
   Domain data (registrations, invoices…) lives in the Redux store instead. */
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

// Restore the session on the very first render so F5 does not bounce to /login.
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
  /** Change fields of the signed-in user (e.g. avatar) everywhere at once, and keep them after F5. */
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
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    dispatch({ type: 'UPDATE', patch });
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...JSON.parse(stored), ...patch }));
    } catch {
      /* storage full or blocked: the change still applies until reload */
    }
  }, []);

  const value = useMemo(() => ({ user: state.user, login, logout, updateUser }), [state.user, login, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

/** The current user as an audit-log actor. */
export const useActor = () => {
  const { user } = useAuth();
  return useMemo(() => ({ id: user?.userId, name: user?.fullname ?? 'Không rõ', role: user?.role ?? 'Unknown' }), [user]);
};
