import React from 'react';
import { Link } from 'react-router-dom';
import { ROLE_HOME } from '../../../api/mockData';
import { useAuth } from '../../../auth/AuthContext';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { BrandMark, DemoClock } from '../../../components/ui/Ht';
import { FLOWS, RULES, ROLES } from './content';

/* Màn hình chính (public) — giới thiệu hệ thống, 6 vai trò và các luồng nghiệp vụ trước khi đăng nhập. */
export const Landing: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="ht ht-landing">
      <header className="ht-landing__bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="ht-brand" to={PATH.landing}><BrandMark />HorseTrack</Link>
          <DemoClock />
        </div>
        <nav className="ht-landing__nav">
          <a href="#roles">Vai trò</a><a href="#flows">Luồng nghiệp vụ</a><a href="#rules">Quy tắc</a>
        </nav>
        <div style={{ display: 'flex', gap: 8 }}>
          {user ? <Link className="ht-btn ht-btn--primary" to={ROLE_HOME[user.role]}>Vào không gian làm việc <Icon name="arrow" size={16} /></Link> : <>
            <Link className="ht-btn ht-btn--ghost" to={PATH.register}>Đăng ký chủ ngựa</Link>
            <Link className="ht-btn ht-btn--primary" to={PATH.login}>Đăng nhập</Link>
          </>}
        </div>
      </header>

      <section className="ht-landing__hero">
        <div>
          <span className="ht-landing__eyebrow">Hệ thống quản lý câu lạc bộ đua ngựa</span>
          <h1>Chuồng ngựa, huấn luyện, y tế và tài chính — trên một hệ thống.</h1>
          <p>HorseTrack kết nối Quản lý CLB, HLV trưởng, Bác sĩ thú y, Người chăm ngựa, Quản lý kho và Chủ ngựa. Mỗi vai trò có không gian làm việc riêng; các quy tắc an toàn được hệ thống kiểm tra tự động.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="ht-btn ht-btn--primary" to={user ? ROLE_HOME[user.role] : PATH.login}><Icon name="key" size={16} />{user ? 'Vào hệ thống' : 'Đăng nhập'}</Link>
            <a className="ht-btn ht-btn--secondary" href="#flows">Xem luồng nghiệp vụ</a>
          </div>
        </div>
        <div className="ht-landing__visual">
          <img src="/horsetrack-logo.png" alt="HorseTrack" />
          <ul>
            <li><Icon name="pulse" size={16} /><span><b>Phiên tập an toàn</b> tự dừng khi nhịp tim vượt ngưỡng</span></li>
            <li><Icon name="heart" size={16} /><span><b>Bác sĩ quyết định y tế</b> — khóa tập, phác đồ, khẩu phần</span></li>
            <li><Icon name="box" size={16} /><span><b>Kho liên thông</b> — giữ hàng, ETA, cấp phát theo lô</span></li>
            <li><Icon name="card" size={16} /><span><b>Thanh toán VNPay</b> chỉ ghi nhận sau khi máy chủ xác minh</span></li>
          </ul>
        </div>
      </section>

      <section id="roles" className="ht-landing__section">
        <h2>6 vai trò trong hệ thống</h2>
        <p className="ht-landing__lede">Đăng nhập một lần — hệ thống đưa bạn tới đúng màn hình theo vai trò.</p>
        <div className="ht-landing__roles">
          {ROLES.map((r) => (
            <article key={r.en} className="ht-landing__role">
              <span className="ht-landing__icon"><Icon name={r.icon} size={20} /></span>
              <div><b>{r.name}</b><small className="ht-mono">{r.en}</small></div>
              <p>{r.text}</p>
              <ul>{r.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section id="flows" className="ht-landing__section">
        <h2>Các luồng nghiệp vụ chính</h2>
        <p className="ht-landing__lede">Mỗi luồng đi qua nhiều vai trò; trạng thái được lưu và ghi nhật ký kiểm toán (BR_10).</p>
        <div className="ht-landing__flows">
          {FLOWS.map((f) => (
            <article key={f.title} className="ht-landing__flow">
              <b>{f.title}</b><small>{f.who}</small>
              <ol>{f.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </article>
          ))}
        </div>
      </section>

      <section id="rules" className="ht-landing__section">
        <h2>Quy tắc nghiệp vụ được hệ thống bảo vệ</h2>
        <div className="ht-landing__rules">
          {RULES.map(([code, text]) => <div key={code}><span className="ht-mono">{code}</span>{text}</div>)}
        </div>
      </section>

      <footer className="ht-landing__foot">
        <span>HorseTrack · Đồ án SWP · Dữ liệu trình diễn</span>
        <Link to={PATH.login}>Đăng nhập <Icon name="arrow" size={14} /></Link>
      </footer>
    </div>
  );
};
