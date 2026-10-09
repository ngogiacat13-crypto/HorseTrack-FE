import React from 'react';
import { Container, Card, Table, Alert } from 'react-bootstrap';
import { MOCK_INVOICES } from '../../api/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Link } from 'react-router-dom';

export const OwnerInvoices: React.FC = () => {
  return (
    <Container fluid>
      <nav className="page-tabs mb-3"><span>Ngựa của tôi</span><span>Giải đua</span><span className="active">Hóa đơn</span><span>Bảng kê chi phí</span></nav>
      <Alert variant="danger" className="d-flex align-items-center mb-4 border-0 shadow-sm">
        <span className="fs-4 me-3">⚠️</span>
        <div><strong>HỢP ĐỒNG ĐÌNH CHỈ</strong> — Vui lòng thanh toán để khôi phục dịch vụ. Bạn vẫn có thể xem hóa đơn và thanh toán.</div>
      </Alert>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h2 className="fw-bold mb-1" style={{ color: '#1B4332' }}>Hóa đơn của tôi</h2><p className="text-muted small mb-0">Lịch sử hóa đơn và trạng thái thanh toán của ngựa.</p></div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0 align-middle">
            <thead style={{ backgroundColor: '#F8F9FA' }}>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Ngựa</th>
                <th>Số tiền</th>
                <th>Hạn thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="fw-bold" style={{ fontFamily: 'Roboto Mono, monospace' }}>{inv.id}</td>
                  <td>{inv.horseName}</td>
                  <td className="fw-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.amount)}</td>
                  <td>{inv.dueDate}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <Link to={`/owner/invoices/${inv.id}`} className="btn btn-sm btn-outline-primary me-2">Chi tiết</Link>
                    <Link to={`/owner/vnpay?invoice=${inv.id}`} className={`btn btn-sm btn-primary${inv.status === 'Paid' ? ' disabled' : ''}`} aria-disabled={inv.status === 'Paid'} onClick={inv.status === 'Paid' ? (event) => event.preventDefault() : undefined}>Thanh toán</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};
