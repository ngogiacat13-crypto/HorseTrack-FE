import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { managerApi, ManagerDashboard as TDashboard } from '../../api/managerApi';
import './manager.css';

export const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<TDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    managerApi.getDashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#1b4332' }} />
      </div>
    );
  }

  const maxBar = Math.max(...data.monthlyCosts.chart.map((c) => c.value));

  // ---- Sessions mở rộng cho 4 dòng ----
  const sessions = [
    { time: '08:00', horse: 'Bolt', plan: 'Tốc độ - P1', hlv: 'Trần Đức Hùng', status: 'Hoàn thành', pill: 'pill-green' },
    { time: '10:00', horse: 'Galaxy', plan: 'Sức bền - P2', hlv: 'Trần Đức Hùng', status: 'Dừng — vượt ngưỡng', pill: 'pill-red', danger: true },
    { time: '11:00', horse: 'Thunder', plan: 'Sức bền - P1', hlv: 'Trần Đức Hùng', status: 'Đang diễn ra', pill: 'pill-blue' },
    { time: '14:00', horse: 'Star', plan: 'Phục hồi - P1', hlv: 'Trần Đức Hùng', status: 'Chưa bắt đầu', pill: 'pill-gray' },
  ];

  // ---- Registrations mở rộng ----
  const registrations = [
    { id: 'REG-0019', horse: 'Thunder Bay', owner: 'Hoàng Thị Lan', date: '01/10/2026', status: 'Chờ xử lý', pill: 'pill-blue' },
    { id: 'REG-0018', horse: 'Silver Wind', owner: 'Đỗ Minh Quân', date: '30/09/2026', status: 'Chờ xử lý', pill: 'pill-blue' },
    { id: 'REG-0017', horse: 'Red Comet', owner: 'Vũ Thị Mai', date: '29/09/2026', status: 'Chờ xử lý', pill: 'pill-blue' },
    { id: 'REG-0016', horse: 'Lightning', owner: 'Vũ Thị Mai', date: '28/09/2026', status: 'Đã duyệt', pill: 'pill-green' },
  ];

  // ---- Tasks ----
  const tasks = [
    { title: 'Cho ăn sáng — Galaxy', over: '+52 phút', groom: 'Phạm Văn Toàn', time: '06:00' },
    { title: 'Dọn chuồng — Thunder', over: '+2 giờ 15', groom: 'Phạm Văn Toàn', time: '07:30' },
    { title: 'Chải lông — Flash', over: '+1 giờ 45', groom: 'Ngô Văn Sơn', time: '08:00' },
  ];

  return (
    <div className="manager-page">
      {/* ==================== HEADER ==================== */}
      <div className="manager-header">
        <div>
          <h1>Bảng điều khiển</h1>
          <p>{data.greeting.message}, {data.greeting.weekday}, {data.greeting.date}</p>
        </div>
        <button className="btn-export">
          <span>⬇</span>
          <span>Xuất báo cáo</span>
        </button>
      </div>

      {/* ==================== TABS ==================== */}
      <div className="manager-tabs">
        {[
          { id: 'overview', label: 'Tổng quan' },
          { id: 'training', label: 'Huấn luyện' },
          { id: 'medical', label: 'Y tế' },
          { id: 'finance', label: 'Tài chính' },
          { id: 'inventory', label: 'Kho' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`manager-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== KPI CARDS ==================== */}
      <div className="kpi-grid">
        {/* Card 1 - green */}
        <div className="kpi-card">
          <div className="kpi-icon green">🐎</div>
          <div>
            <div className="kpi-value">12</div>
            <div className="kpi-label">Tổng ngựa đang quản lý</div>
          </div>
          <span className="kpi-trend up">↑ +2 tháng này</span>
        </div>

        {/* Card 2 - blue */}
        <div className="kpi-card">
          <div className="kpi-icon blue">📋</div>
          <div>
            <div className="kpi-value">3</div>
            <div className="kpi-label">Đăng ký ngựa chờ duyệt</div>
          </div>
          <span className="kpi-trend neutral">cập nhật 3 ngày</span>
        </div>

        {/* Card 3 - cream */}
        <div className="kpi-card">
          <div className="kpi-icon cream">✎</div>
          <div>
            <div className="kpi-value">2</div>
            <div className="kpi-label">Phác đồ chờ phê duyệt</div>
          </div>
          <span className="kpi-trend neutral">đ 8,400,000</span>
        </div>

        {/* Card 4 - red WITH BORDER */}
        <div className="kpi-card danger-border">
          <div className="kpi-icon red">🔔</div>
          <div>
            <div className="kpi-value">5</div>
            <div className="kpi-label">Công việc quá hạn &gt; 45 phút</div>
          </div>
          <span className="kpi-trend danger">↑ +3 hôm nay</span>
        </div>
      </div>

      {/* ==================== ROW 1 ==================== */}
      <div className="row-2-col">
        {/* Đăng ký ngựa gần đây */}
        <div className="section-card">
          <div className="section-header">
            <h3>Đăng ký ngựa gần đây</h3>
            <a href="/manager/registrations">Xem tất cả →</a>
          </div>
          <table className="mt-table">
            <thead>
              <tr>
                <th>MÃ HỒ SƠ</th>
                <th>NGỰA</th>
                <th>CHỦ NGỰA</th>
                <th>NGÀY GỬI</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td className="id">{r.id}</td>
                  <td className="name">{r.horse}</td>
                  <td>{r.owner}</td>
                  <td className="date">{r.date}</td>
                  <td><span className={`pill ${r.pill}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hóa đơn quá hạn */}
        <div className="section-card">
          <div className="section-header">
            <h3>Hóa đơn quá hạn</h3>
            <span className="pill pill-red">3</span>
          </div>
          <div className="invoice-list">
            <div className="invoice-item">
              <div className="inv-top">
                <span className="inv-id">INV-0042</span>
                <span className="pill pill-darkred">Đình chỉ</span>
              </div>
              <div className="inv-line-2">Galaxy — Hoàng Thị Lan</div>
              <div className="inv-bottom">
                <span className="inv-overdue">Quá hạn 22 ngày</span>
                <span className="inv-amount">đ 15,000,000</span>
              </div>
            </div>
            <div className="invoice-item">
              <div className="inv-top">
                <span className="inv-id">INV-0047</span>
                <span className="pill pill-orange">Quá hạn</span>
              </div>
              <div className="inv-line-2">Storm — Đỗ Minh Quân</div>
              <div className="inv-bottom">
                <span className="inv-overdue">Quá hạn 8 ngày</span>
                <span className="inv-amount">đ 6,000,000</span>
              </div>
            </div>
            <div className="invoice-item">
              <div className="inv-top">
                <span className="inv-id">INV-0049</span>
                <span className="pill pill-orange">Quá hạn</span>
              </div>
              <div className="inv-line-2">Star — Vũ Thị Mai</div>
              <div className="inv-bottom">
                <span className="inv-overdue">Quá hạn 2 ngày</span>
                <span className="inv-amount">đ 12,500,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ROW 2 ==================== */}
      <div className="row-2-col">
        {/* Phiên tập hôm nay */}
        <div className="section-card">
          <div className="section-header">
            <h3>Phiên tập hôm nay</h3>
            <a href="/manager/sessions">Xem chi tiết →</a>
          </div>
          <table className="mt-table">
            <thead>
              <tr>
                <th>GIỜ</th>
                <th>NGỰA</th>
                <th>KẾ HOẠCH</th>
                <th>HLV</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i} className={s.danger ? 'row-danger' : ''}>
                  <td className="id">{s.time}</td>
                  <td className="name">{s.horse}</td>
                  <td>{s.plan}</td>
                  <td>{s.hlv}</td>
                  <td><span className={`pill ${s.pill}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Công việc quá hạn */}
        <div className="section-card">
          <div className="section-header">
            <h3>Công việc quá hạn</h3>
            <span className="pill pill-red">BR_05</span>
          </div>
          <div className="task-list">
            {tasks.map((t, i) => (
              <div key={i} className="task-item">
                <div className="task-top">
                  <span className="task-title">{t.title}</span>
                  <span className="task-over">{t.over}</span>
                </div>
                <div className="task-sub">{t.groom} · {t.time}</div>
              </div>
            ))}
          </div>
          <div className="task-footer">
            <a href="#">Xem 2 việc khác →</a>
          </div>
        </div>
      </div>

      {/* ==================== ROW 3 ==================== */}
      <div className="row-2-col">
        {/* Chi phí thú y theo tháng */}
        <div className="section-card">
          <div className="chart-header">
            <div>
              <h3>Chi phí thú y theo tháng</h3>
              <div className="chart-sub">6 tháng gần nhất - đơn vị triệu đ</div>
            </div>
            <div className="chart-total">
              <div className="value">đ 42,600,000</div>
              <div className="trend">+18% so với tháng 8</div>
            </div>
          </div>
          <div className="bar-chart">
            {data.monthlyCosts.chart.map((c) => {
              let cls = 'light';
              if (c.month === 'T9') cls = 'dark';
              if (c.month === 'T10') cls = 'gold';
              const h = (c.value / maxBar) * 100;
              return (
                <div key={c.month} className="bar-col">
                  <div className="bar-value">{c.value}</div>
                  <div className="bar-track">
                    <div className={`bar-fill ${cls}`} style={{ height: `${h}%` }} />
                  </div>
                  <div className="bar-label">{c.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nhật ký hệ thống */}
        <div className="section-card">
          <div className="section-header">
            <h3>Nhật ký hệ thống</h3>
          </div>
          <div className="log-list">
            <div className="log-item">
              <div className="log-dot red" />
              <div className="log-content">
                <div className="log-msg">Hệ thống dừng phiên S-0023 (Galaxy)</div>
                <div className="log-time">18:23 03/10/2026</div>
              </div>
            </div>
            <div className="log-item">
              <div className="log-dot orange" />
              <div className="log-content">
                <div className="log-msg">Lê Thị Hương gửi phác đồ PD-0011</div>
                <div className="log-time">16:48 02/10/2026</div>
              </div>
            </div>
            <div className="log-item">
              <div className="log-dot green" />
              <div className="log-content">
                <div className="log-msg">Nguyễn Văn Minh duyệt hồ sơ REG-0016</div>
                <div className="log-time">09:12 28/09/2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
