import React from 'react';
import { Link } from 'react-router-dom';
import { ROLE_HOME } from '../../../api/mockData';
import { useAuth } from '../../../auth/AuthContext';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { BrandMark, DemoClock } from '../../../components/ui/Ht';
import { CORE_FEATURES } from './content';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="ht ht-landing">
      <header className="ht-landing__bar">
        <div className="ht-landing__brand-row">
          <Link className="ht-brand" to={PATH.landing}><BrandMark />HorseTrack</Link>
          <DemoClock />
        </div>
        <nav className="ht-landing__nav">
          <a href="#features">Tính năng cốt lõi</a>
        </nav>
        <div className="ht-landing__actions">
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
            <a className="ht-btn ht-btn--secondary" href="#features">Xem tính năng cốt lõi</a>
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

      <section id="features" className="ht-landing__features" aria-labelledby="ht-landing-features-title">
        <div className="ht-landing__features-inner">
          <div className="ht-landing__features-heading">
            <span className="ht-landing__features-eyebrow">QUY TRÌNH HỆ THỐNG</span>
            <h2 id="ht-landing-features-title">TÍNH NĂNG CỐT LÕI</h2>
            <p>HorseTrack kết nối các khâu vận hành câu lạc bộ, từ chăm sóc ngựa đến tổ chức thi đấu.</p>
          </div>
          <div className="ht-landing__feature-grid">
            {CORE_FEATURES.map((feature, index) => (
              <article id={feature.id} key={feature.title} className={`ht-landing__feature ht-landing__feature--${index + 1}`}>
                <span className={`ht-landing__feature-icon ht-landing__feature-icon--${feature.tone}`}><Icon name={feature.icon} size={22} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                {feature.highlights && <div className="ht-landing__feature-highlights">{feature.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}</div>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="ht-landing__foot">
        <div className="ht-landing__foot-brand">
          <Link className="ht-landing__foot-logo" to={PATH.landing}><BrandMark /><span>HORSE<span>TRACK</span></span></Link>
          <p>Hệ thống quản lý toàn diện các giải đua ngựa chuyên nghiệp. Mang lại sự công bằng, minh bạch và trải nghiệm tuyệt vời cho mọi người chơi.</p>
        </div>
        <div className="ht-landing__foot-column">
          <h3>Đường dẫn nhanh</h3>
          <a href="#feature-tournaments" data-testid="footer-tournaments-link">Quản lý giải đấu</a>
          <a href="#feature-registration" data-testid="footer-registration-link">Đăng ký ngựa dự thi</a>
          <a href="#feature-training" data-testid="footer-schedule-link">Lịch tập & giáo án</a>
          <a href="#feature-results" data-testid="footer-results-link">Kết quả & tiền thưởng</a>
        </div>
        <div className="ht-landing__foot-column">
          <h3>Hỗ trợ người dùng</h3>
          <a href="#features" data-testid="footer-support-link">Trung tâm hỗ trợ</a>
          <a href="#features" data-testid="footer-guide-link">Hướng dẫn sử dụng</a>
          <a href="#features" data-testid="footer-faq-link">Câu hỏi thường gặp</a>
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
