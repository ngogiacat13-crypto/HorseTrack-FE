import React from 'react';
import { Link } from 'react-router-dom';
import { ROLE_HOME } from '../../../api/mockData';
import { useAuth } from '../../../auth/AuthContext';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { BrandMark, DemoClock } from '../../../components/ui/Ht';
import { FLOWS, RULES } from './content';

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
          <a href="#flows">Luồng nghiệp vụ</a><a href="#rules">Quy tắc</a>
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
        <div className="ht-landing__foot-brand">
          <Link className="ht-landing__foot-logo" to={PATH.landing}><BrandMark /><span>HORSE<span>TRACK</span></span></Link>
          <p>Hệ thống quản lý toàn diện các giải đua ngựa chuyên nghiệp. Mang lại sự công bằng, minh bạch và trải nghiệm tuyệt vời cho mọi người chơi.</p>
        </div>
        <div className="ht-landing__foot-column">
          <h3>Đường dẫn nhanh</h3>
          <a href="#flows" data-testid="footer-flows-link">Danh sách giải đấu</a>
          <a href="#flows" data-testid="footer-schedule-link">Lịch thi đấu đua ngựa</a>
          <a href="#rules" data-testid="footer-rules-link">Bảng xếp hạng</a>
          <a href="#rules" data-testid="footer-prediction-link">Dự đoán kết quả</a>
        </div>
        <div className="ht-landing__foot-column">
          <h3>Hỗ trợ người dùng</h3>
          <a href="#rules" data-testid="footer-support-link">Trung tâm hỗ trợ</a>
          <a href="#flows" data-testid="footer-guide-link">Hướng dẫn sử dụng</a>
          <a href="#rules" data-testid="footer-faq-link">Câu hỏi thường gặp</a>
          <a href="mailto:support@horsetrack.local" data-testid="footer-contact-link">Liên hệ chúng tôi</a>
        </div>
        <div className="ht-landing__foot-column ht-landing__foot-social">
          <h3>Mạng xã hội</h3>
          <div>
            <a href="https://facebook.com" aria-label="Facebook" data-testid="footer-facebook-link">f</a>
            <a href="https://x.com" aria-label="X" data-testid="footer-x-link">𝕏</a>
            <a href="https://instagram.com" aria-label="Instagram" data-testid="footer-instagram-link">◎</a>
            <a href="https://youtube.com" aria-label="YouTube" data-testid="footer-youtube-link">▶</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
