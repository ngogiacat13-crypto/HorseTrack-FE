import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { ROLE_HOME } from '../../../api/mockData';
import { PATH } from '../../../routers/routerPath';
import { BackButton, BrandMark } from '../../../components/ui/Ht';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

/* 404 — route "*". Shows the wrong address and offers: go back (navigate(-1)) or go to the home page of the role. */
export const NotFound: React.FC = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const home = user ? ROLE_HOME[user.role] : PATH.landing;
  useDocumentTitle('Không tìm thấy trang');

  return (
    <main className="ht ht-notfound">
      <div className="ht-notfound__box">
        <Link className="ht-brand" to={home}><BrandMark />HorseTrack</Link>
        <div className="ht-notfound__code" aria-hidden="true">404</div>
        <h1 className="ht-page-title">Không tìm thấy trang</h1>
        <p className="ht-page-sub">Đường dẫn <span className="ht-mono">{pathname}</span> không tồn tại hoặc đã được đổi.</p>
        <div className="ht-notfound__actions">
          <BackButton fallback={home} />
          <Link className="ht-btn ht-btn--primary" to={home}>{user ? 'Về trang làm việc' : 'Về trang chủ'}</Link>
        </div>
      </div>
    </main>
  );
};
