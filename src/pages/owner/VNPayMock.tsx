import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Container } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { MOCK_INVOICES } from '../../api/mockData';

type MockResult = 'success' | 'failure' | 'pending';
const resultLabels: Record<MockResult, string> = { success: 'Thành công', failure: 'Thất bại', pending: 'Đang xử lý' };

export const VNPayMock: React.FC = () => {
  const [params] = useSearchParams();
  const invoiceId = params.get('invoice') ?? 'INV-0042';
  const invoice = MOCK_INVOICES.find((item) => item.id === invoiceId) ?? MOCK_INVOICES[0];
  const [result, setResult] = useState<MockResult>('success');

  return (
    <div className="payment-page">
      <header className="payment-header"><Link to="/owner/invoices" className="payment-brand"><img src="/horsetrack-logo.png" alt="" />HorseTrack</Link><Link to={`/owner/invoices/${invoice.id}`} className="small text-decoration-none">‹　Quay lại HorseTrack</Link></header>
      <Container className="payment-container">
        <Card><Card.Body>
          <div className="d-flex justify-content-between align-items-center"><div><h2 className="fw-bold mb-1">Thanh toán VNPay MOCK</h2><small className="text-muted">Mô phỏng kết quả · Không tích hợp cổng thanh toán</small></div><Badge bg="warning" text="dark">● MÔ PHỎNG</Badge></div>
          <Alert variant="warning" className="mt-3"><strong>⚠　Đây là trang thanh toán mô phỏng.</strong><div className="small mt-1">Kết quả Thành công chỉ chuyển giao dịch sang Chờ xác minh, KHÔNG phải đã thanh toán.</div></Alert>
          <div className="payment-amount"><small className="text-muted">Số tiền giao dịch</small><strong>{new Intl.NumberFormat('vi-VN').format(invoice.amount)} ₫</strong><Badge bg="warning" text="dark">● Hóa đơn chưa thanh toán</Badge></div>
          <div className="payment-details">{[['Mã giao dịch', `TXN-${invoice.id.slice(-4)}`], ['Nội dung', `Thanh toán hóa đơn ${invoice.id}`], ['Chủ ngựa', 'Hoàng Thị Lan'], ['Ngựa', invoice.horseName]].map(([label, value]) => <div className="info-pair" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <strong className="small d-block mb-2">Chọn kết quả mô phỏng</strong>
          <div className="d-flex flex-wrap gap-2 mb-2">{(['success', 'failure', 'pending'] as const).map((value) => <Button key={value} variant={result === value ? value === 'success' ? 'success' : value === 'failure' ? 'danger' : 'secondary' : 'outline-secondary'} size="sm" onClick={() => setResult(value)}>{result === value ? '✓　' : ''}{resultLabels[value]}</Button>)}</div>
          <small className="text-muted">Cả ba lựa chọn chỉ là kết quả MOCK, không phát sinh thanh toán thực tế.</small>
          <div className="mock-status mt-3"><div className="d-flex justify-content-between"><strong>Trạng thái sau kết quả “{resultLabels[result]}”</strong><Badge bg={result === 'failure' ? 'danger' : 'warning'} text={result === 'failure' ? undefined : 'dark'}>{result === 'failure' ? 'Thất bại' : 'Chờ xác minh'}</Badge></div><div className="payment-steps"><div><strong>Khởi tạo</strong><small>Giao dịch đã tạo</small></div><span>→</span><div className="active"><strong>{result === 'failure' ? 'Thất bại' : 'Chờ xác minh'}</strong><small>{result === 'failure' ? 'Giao dịch mô phỏng thất bại' : 'Chưa ghi nhận thanh toán'}</small></div><span>→</span><div><strong>Đã xác minh thanh toán</strong><small>Chưa đạt · cần xác minh độc lập</small></div></div><small className="text-muted">Chỉ mô phỏng xác minh độc lập dành cho nhà phát triển tham chiếu, không có xác nhận thanh toán thủ công.</small></div>
          <div className="mt-3"><strong className="small">Thanh toán không gỡ các trạng thái dừng</strong><p className="small text-muted mt-2 mb-0">Khóa tập do Bác sĩ thú y và đóng băng y tế là hai trạng thái riêng; thanh toán không gỡ các trạng thái này.</p><p className="small text-muted mb-0">Hợp đồng Đình chỉ: khôi phục vẫn chờ xác minh công thức phạt.</p></div>
        </Card.Body></Card>
        <div className="d-flex justify-content-between mt-3 small text-muted"><span>HorseTrack · Chỉ dùng trong trình diễn</span><span>03/10/2026 · Asia/Ho_Chi_Minh</span></div>
      </Container>
    </div>
  );
};
