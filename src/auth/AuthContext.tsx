import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, authApi } from '../api/mockData';

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Khôi phục phiên đăng nhập khi refresh trang
  useEffect(() => {
    const stored = localStorage.getItem('horsetrack_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('horsetrack_user'); }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const u = await authApi.login(username, password);
    setUser(u);
    localStorage.setItem('horsetrack_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('horsetrack_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);