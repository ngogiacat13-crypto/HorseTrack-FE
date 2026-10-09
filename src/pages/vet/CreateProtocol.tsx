import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

export const CreateProtocol: React.FC = () => {
  const [saved, setSaved] = useState(false);
  return (
    <Container fluid>
      <div className="small text-muted mb-2">Phác đồ điều trị　›　Tạo mới</div>
      <h2 className="fw-bold mb-3">Tạo phác đồ điều trị　<span className="text-muted">/</span>　Storm <Badge bg="danger">● Chấn thương</Badge></h2>
      <div className="protocol-progress"><span className="done">✓ Giai đoạn</span><i /><span className="done">✓ Thuốc &amp; Vật tư</span><i /><span className="current">3　Kiểm kho</span><i /><span>4　Gửi duyệt</span></div>
      {saved && <Alert variant="success">Bản nháp phác đồ đã được lưu trong môi trường demo.</Alert>}
      <Row className="g-3">
        <Col xl={9}>
          <Card className="mb-3"><Card.Body>
            <strong><Badge bg="light" text="dark">01</Badge>　Giai đoạn 1 · Chống viêm cấp</strong>
            <Row className="g-2 mt-2"><Col md={4}><Form.Label>Ngày bắt đầu</Form.Label><Form.Control type="date" defaultValue="2026-10-08" /></Col><Col md={2}><Form.Label>Thời lượng</Form.Label><Form.Control defaultValue="10 ngày" /></Col><Col md={6}><Form.Label>Mục tiêu</Form.Label><Form.Control defaultValue="Giảm sưng" /></Col></Row>
            <Table responsive className="mt-3 mb-1 align-middle"><thead><tr><th>Thuốc / vật tư</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody><tr><td>Thuốc ABC <small className="text-muted">· kháng viêm</small></td><td><Form.Control size="sm" type="number" defaultValue={10} /></td><td>₫ 500,000</td><td className="fw-semibold">₫ 5,000,000</td></tr><tr><td>Băng gạc <small className="text-muted">· băng bó</small></td><td><Form.Control size="sm" type="number" defaultValue={20} /></td><td>₫ 50,000</td><td className="fw-semibold">₫ 1,000,000</td></tr></tbody></Table>
            <div className="d-flex justify-content-between"><Button variant="link" className="p-0 text-success">＋ Thêm thuốc</Button><strong className="small">Chi phí giai đoạn: ₫ 6,000,000</strong></div>
          </Card.Body></Card>
          <Card className="mb-3"><Card.Body className="d-flex justify-content-between align-items-center"><div><Badge bg="light" text="dark">02</Badge>　<strong>Giai đoạn 2 · Phục hồi gân</strong><div className="text-muted small ms-5">Bắt đầu 19/10/2026 · Thuốc XYZ × 30 viên</div></div><strong>₫ 2,400,000　⌄</strong></Card.Body></Card>
          <Button variant="outline-secondary" className="w-100 mb-3">＋　Thêm giai đoạn</Button>
          <Card><Card.Body><div className="d-flex justify-content-between"><strong>▣　Kiểm tra tồn kho · Giai đoạn 1</strong><small className="text-muted">So với ngày bắt đầu 08/10</small></div>
            <Table responsive className="mt-2 mb-0"><thead><tr><th>Vật tư</th><th>Tồn kho</th><th>Nhập về</th><th>Cần</th><th>Trạng thái</th></tr></thead><tbody><tr><td>Thuốc ABC</td><td>5</td><td>38 (07/10)</td><td>10</td><td><Badge bg="success">Đủ (dự kiến)</Badge></td></tr><tr><td>Băng gạc</td><td className="text-danger">8</td><td>50 (18/10)</td><td>20</td><td><Badge bg="warning" text="dark">Chưa nhập kịp</Badge></td></tr></tbody></Table>
            <Alert variant="warning" className="small mb-0 mt-2">Băng gạc: chỉ có 8/20. Kiểm tra lịch nhập hoặc điều chỉnh số lượng trước khi bắt đầu.</Alert>
          </Card.Body></Card>
        </Col>
        <Col xl={3}>
          <Card className="mb-3"><Card.Body><strong>Tóm tắt phác đồ</strong>{[['Ngựa', 'Storm · VN-MC-0842'], ['Ca khám', 'C-0012'], ['Khóa tập', 'ĐANG KHÓA'], ['Số giai đoạn', '2'], ['Giai đoạn 1', '₫ 6,000,000'], ['Giai đoạn 2', '₫ 2,400,000']].map(([a,b]) => <div className="info-pair mt-2" key={a}><span>{a}</span><strong>{b}</strong></div>)}<hr /><div className="d-flex justify-content-between fw-bold mb-3"><span>Tổng chi phí</span><span>₫ 8,400,000</span></div><Button className="w-100 mb-2" onClick={() => setSaved(true)}>Gửi duyệt →</Button><Button variant="outline-secondary" className="w-100" onClick={() => setSaved(true)}>Lưu nháp</Button></Card.Body></Card>
          <Alert variant="info"><strong>ⓘ Yêu cầu nhập hàng tự động</strong><div className="small mt-1">Hệ thống tạo yêu cầu BR-0081 cho băng gạc. Tồn kho dự kiến sau nhập: 58 cuộn.</div></Alert>
          <Alert variant="warning"><strong>▣ Thanh toán theo giai đoạn</strong><div className="small mt-1">Sau khi Quản lý CLB duyệt, chủ ngựa nhận thông báo chi phí.</div></Alert>
        </Col>
      </Row>
    </Container>
  );
};
