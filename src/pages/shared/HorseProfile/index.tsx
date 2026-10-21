import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { ROLE_HOME } from '../../../api/mockData';
import { PATH, toPath } from '../../../routers/routerPath';

export const HorseProfile: React.FC = () => {
  const { id = '' } = useParams();
  const { user } = useAuth();
  if (!user) return <Navigate to={PATH.login} replace />;
  const byRole: Partial<Record<string, string>> = {
    HorseOwner: toPath(PATH.owner.horse, { id }),
    HeadTrainer: toPath(PATH.trainer.horse, { id }),
    Veterinarian: toPath(PATH.vet.horse, { id }),
    Groom: PATH.groom.stable,
  };
  return <Navigate to={byRole[user.role] ?? ROLE_HOME[user.role]} replace />;
};
