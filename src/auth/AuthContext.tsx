import React, { createContext, useContext, useState } from 'react';
import { AuthUser, authApi } from '../api/mockData';

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khôi phục phiên đăng nhập ngay ở lần render đầu, để F5 không bị đẩy về /login rồi về trang chủ vai trò
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('horsetrack_user');
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      localStorage.removeItem('horsetrack_user');
      return null;
    }
  });

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