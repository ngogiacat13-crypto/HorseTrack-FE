import React from 'react';
import { Alert, Badge, Card, Col, Container, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { MOCK_INVOICES } from '../../../api/mockData';

const money = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

export const InvoiceDetail: React.FC = () => {
  const { id = 'INV-0042' } = useParams();
  const invoice = MOCK_INVOICES.find((item) => item.id === id) ?? MOCK_INVOICES[0];
  const overdue = invoice.status === 'Overdue';

  return (
    <Container fluid>
      <div className="page-tabs mb-3"><span>Ngựa của tôi</span><span>Giải đua</span><span className="active">Hóa đơn</span><span>Bảng kê chi phí</span></div>
      <div className="small text-muted mb-2"><Link to="/owner/invoices" className="text-decoration-none">‹　Quay lại hóa đơn</Link>　/　{invoice.id}</div>
      <div className="d-flex justify-content-between align-items-start mb-3"><div><h2 className="fw-bold mb-1">Chi tiết hóa đơn</h2><p className="text-muted small mb-0">{invoice.horseName} · Dịch vụ huấn luyện tháng 09/2026</p></div><Badge bg={overdue ? 'danger' : invoice.status === 'Paid' ? 'success' : 'warning'}>{overdue ? '● Quá hạn' : invoice.status === 'Paid' ? '● Đã thanh toán' : '● Chờ thanh toán'}</Badge></div>
      {overdue && <Alert variant="danger"><strong>♧　Hợp đồng Đình chỉ — dịch vụ đang tạm dừng</strong><div className="small mt-1">Bạn vẫn có thể xem hóa đơn và thanh toán. Thanh toán tự động khôi phục dịch vụ; cần tất toán đầy đủ và xác minh công thức phạt trước khi xem xét khôi phục.</div></Alert>}
      <Row className="g-3 mb-3">{[['Trạng thái hóa đơn', overdue ? '● Quá hạn' : '● Chờ thanh toán', overdue ? 'danger' : 'warning'], ['Trạng thái giao dịch', '● Chưa thanh toán', 'warning'], ['Trạng thái hợp đồng', overdue ? '● Đình chỉ' : '● Hoạt động', overdue ? 'danger' : 'success']].map(([label, value, tone]) => <Col md={4} key={label}><Card><Card.Body><small className="text-muted">{label}</small><div className="mt-2"><Badge bg={tone}>{value}</Badge></div><p className="small mt-2 mb-0">{overdue ? 'Quá hạn từ 11/09/2026 00:00.' : 'Trạng thái hiện tại của hóa đơn.'}</p></Card.Body></Card></Col>)}</Row>
      <Row className="g-3">
        <Col xl={8}>
          <Card className="mb-3"><Card.Body><strong>Thông tin hóa đơn</strong><p className="small text-muted">Dịch vụ thuộc ngựa của Hoàng Thị Lan</p><div className="d-flex justify-content-between"><h5 className="font-monospace">#{invoice.id}</h5><small className="text-muted">Kỳ dịch vụ · 09/2026</small></div><Row className="g-2 small mb-3"><Col md={6}><div className="info-pair"><span>Ngựa</span><strong>{invoice.horseName}</strong></div><div className="info-pair"><span>Chủ ngựa</span><strong>Hoàng Thị Lan</strong></div><div className="info-pair"><span>Loại dịch vụ</span><strong>Huấn luyện</strong></div></Col><Col md={6}><div className="info-pair"><span>Ngày phát hành</span><strong>01/09/2026 00:00</strong></div><div className="info-pair"><span>Hạn thanh toán</span><strong>{invoice.dueDate} 23:59:59</strong></div><div className="info-pair"><span>Kỳ thanh toán</span><strong>Tháng 09/2026</strong></div></Col></Row><div className="invoice-line d-flex justify-content-between p-2 bg-light small"><span>Huấn luyện — {invoice.horseName}</span><strong>{money(invoice.amount)}</strong></div></Card.Body></Card>
          <Card className="mb-3"><Card.Body><strong>Các mốc thanh toán</strong><p className="small text-muted">Mốc thời gian demo · Asia/Ho_Chi_Minh</p><div className="timeline-row">{[['Phát hành', '01/09/2026 00:00'], ['Hạn thanh toán', `${invoice.dueDate} 23:59:59`], ['Bắt đầu quá hạn', '11/09/2026 00:00'], ['Đình chỉ dịch vụ', '25/09/2026 00:00']].map(([title, date]) => <div key={title}><span className="timeline-dot" /><strong>{title}</strong><small>{date}</small></div>)}</div></Card.Body></Card>
          {overdue && <Alert variant="warning" className="small"><strong>ⓘ Khôi phục: chờ xác định công thức phạt</strong><div className="mt-1">Chỉ xem. Chưa có công thức phạt nên chưa thể xác định điều kiện tất toán đầy đủ.</div></Alert>}
        </Col>
        <Col xl={4}>
          <Card className="mb-3"><Card.Body><strong>Thanh toán hóa đơn</strong><div className="small text-muted mt-3">Giá trị dịch vụ</div><div className="invoice-total">{money(invoice.amount)}</div><hr /><div className="info-pair"><span>Hóa đơn</span><strong>{invoice.id}</strong></div><div className="info-pair mt-2"><span>Thanh toán</span><strong>{invoice.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></div><p className="small text-danger mt-2">Phạt: chưa xác định</p><Link to={`/owner/vnpay?invoice=${invoice.id}`} className={`btn btn-primary w-100${invoice.status === 'Paid' ? ' disabled' : ''}`} aria-disabled={invoice.status === 'Paid'} onClick={invoice.status === 'Paid' ? (event) => event.preventDefault() : undefined}>▣　Thanh toán qua VNPay</Link><small className="text-muted d-block mt-2">Chỉ thanh toán mô phỏng; không xác nhận thanh toán thật.</small></Card.Body></Card>
          <Card><Card.Body><strong>Điều kiện ghi nhận và khôi phục</strong><ol className="small mt-3 ps-3"><li className="mb-2">Giao dịch phải được xác minh đúng tham chiếu, nội dung và số tiền.</li><li className="mb-2">Tất toán đầy đủ nghĩa vụ đã xác minh, bao gồm phạt nếu có công thức.</li><li>Khôi phục dịch vụ vẫn chờ xác minh công thức phạt và hợp đồng.</li></ol></Card.Body></Card>
        </Col>
      </Row>
    </Container>
  );
};
