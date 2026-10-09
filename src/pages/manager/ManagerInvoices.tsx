import React, { useEffect, useState } from 'react';
import { Spinner, Row, Col } from 'react-bootstrap';
import { managerApi } from '../../api/managerApi';
import './manager.css';

export const ManagerInvoices: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.getInvoices().then((res) => { setData(res); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div className="manager-page">
      <h2 className="fw-bold mb-1">Quản lý hóa đơn</h2>
      <p className="text-muted mb-4">Theo dõi thanh toán & xử lý hóa đơn quá hạn (BR_13, BR_14)</p>

      {/* Summary */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-green">💰</div>
            <div className="kpi-info">
              <h3>{data.summary.totalRevenue.toLocaleString('vi-VN')}</h3>
              <p>Tổng doanh thu (đ)</p>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-red">⚠️</div>
            <div className="kpi-info">
              <h3>{data.summary.totalOverdue.toLocaleString('vi-VN')}</h3>
              <p>Quá hạn (đ)</p>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-orange">⏳</div>
            <div className="kpi-info">
              <h3>{data.summary.totalPending.toLocaleString('vi-VN')}</h3>
              <p>Chờ thanh toán (đ)</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <div className="section-card">
        <table className="manager-table">
          <thead>
            <tr>
              <th>MÃ HÓA ĐƠN</th>
              <th>NGỰA</th>
              <th>CHỦ NGỰA</th>
              <th>KỲ</th>
              <th>SỐ TIỀN</th>
              <th>QUÁ HẠN</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((inv: any) => (
              <tr key={inv.id}>
                <td className="fw-semibold">{inv.id}</td>
                <td>{inv.horse.name}</td>
                <td>{inv.owner.fullName}</td>
                <td>{inv.period}</td>
                <td className="fw-semibold">{inv.totalAmount.toLocaleString('vi-VN')} đ</td>
                <td>
                  {inv.overdueDays > 0 ? (
                    <span className="text-danger fw-semibold">{inv.overdueDays} ngày</span>
                  ) : '-'}
                </td>
                <td>
                  <span className={`status-badge ${
                    inv.status === 'Suspended' ? 'status-suspended' :
                    inv.status === 'Overdue' ? 'status-overdue' :
                    inv.status === 'Paid' ? 'status-approved' : 'status-pending'
                  }`}>
                    {inv.status === 'Suspended' ? 'Đình chỉ' :
                     inv.status === 'Overdue' ? 'Quá hạn' :
                     inv.status === 'Paid' ? 'Đã TT' : 'Chờ TT'}
                  </span>
                </td>
                <td>
                  {inv.overdueDays >= 25 && inv.status !== 'Suspended' && (
                    <button className="btn btn-sm btn-outline-danger me-1">Đình chỉ</button>
                  )}
                  {inv.status === 'Suspended' && (
                    <button className="btn btn-sm btn-outline-success">Kích hoạt</button>
                  )}
                  <button className="btn btn-sm btn-outline-primary">Chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
