import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_HOME, Role } from '../api/mockData';
import { PATH } from './routerPath';

/** Lets only the given role in; other roles go back to their own home page. */
export const RoleGuard: React.FC<{ role: Role; children: React.ReactElement }> = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to={PATH.login} replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
};
