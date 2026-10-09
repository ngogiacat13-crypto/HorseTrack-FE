import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { MOCK_HORSES } from '../../api/mockData';

export const RaceRegistration: React.FC = () => {
  const [horseId, setHorseId] = useState('h1');
  const [sent, setSent] = useState(false);
  const horse = MOCK_HORSES.find((item) => item.id === horseId) ?? MOCK_HORSES[0];

  return (
    <Container fluid>
      <div className="page-tabs mb-3"><Link to="/trainer">Tổng quan đàn ngựa</Link><span>Kế hoạch</span><span>Lịch huấn luyện</span><span>Nhật ký</span><span>Khẩu phần</span><span className="active">Giải đua</span></div>
      <div className="d-flex justify-content-between align-items-start mb-3"><div><h2 className="fw-bold mb-1">Đăng ký ngựa thi đấu</h2><p className="text-muted small mb-0">Lập hồ sơ tham gia giải đua bên thứ ba / ngày tổ chức.</p></div><Badge bg="warning" text="dark">● DEMO ONLY</Badge></div>
      <Alert variant="warning"><strong>DEMO ONLY — định nghĩa vận hành thực tế đang chờ quyết định</strong><div className="small mt-1">Huấn luyện viên là người khởi tạo trong giả định demo. Biểu mẫu chỉ tạo hồ sơ kiểm tra nội bộ, không đăng ký trực tiếp với ban tổ chức.</div></Alert>
      {sent && <Alert variant="success">Hồ sơ đăng ký demo đã được lưu để xem trước. Chưa gửi tới ban tổ chức.</Alert>}
      <Card className="mb-3"><Card.Body><strong>Quy trình BR04 · HLV gửi → Bác sĩ xác nhận → Chủ đồng ý</strong><div className="workflow-steps"><span className="complete">1　 HLV gửi<small>Hiện tại · Chưa gửi</small></span><span>2　 Bác sĩ xác nhận<small>Chờ hồ sơ và khám xác nhận</small></span><span>3　 Chủ đồng ý<small>Chờ bác sĩ xác nhận</small></span></div></Card.Body></Card>
      <Row className="g-3">
        <Col xl={8}>
          <Card className="mb-3"><Card.Body><strong>Thông tin giải đấu bên thứ ba</strong><p className="text-muted small">Thông tin bên ngoài phục vụ hồ sơ đề nghị</p><Row className="g-3">
            <Col md={6}><Form.Label>Tên giải đấu *</Form.Label><Form.Control defaultValue="Giải đua Đại Việt 2026" /></Col>
            <Col md={6}><Form.Label>Đơn vị tổ chức *</Form.Label><Form.Control defaultValue="Hiệp hội đua ngựa VN" /></Col>
            <Col md={6}><Form.Label>Ngày thi đấu *</Form.Label><Form.Control type="date" defaultValue="2026-11-15" /></Col>
            <Col md={6}><Form.Label>Cự ly *</Form.Label><Form.Control defaultValue="1600m" /></Col>
            <Col><Form.Label>Địa điểm *</Form.Label><Form.Control defaultValue="Trường đua Phú Thọ" /></Col>
          </Row></Card.Body></Card>
          <Card><Card.Body><strong>Chọn ngựa đủ điều kiện</strong><p className="text-muted small">Chọn một ngựa khỏe mạnh. Ngựa chấn thương hoặc bị khóa tập không thể chọn.</p>
            {MOCK_HORSES.map((item) => <button type="button" key={item.id} className={`horse-option ${horseId === item.id ? 'selected' : ''} ${item.isLocked || item.healthStatus === 'Injured' ? 'disabled-option' : ''}`} disabled={item.isLocked || item.healthStatus === 'Injured'} onClick={() => setHorseId(item.id)}><span className="horse-radio">{horseId === item.id ? '●' : ''}</span><span className="flex-grow-1"><strong>{item.name}</strong><small>{item.id.toUpperCase()} · {item.breed}</small></span><Badge bg={item.isLocked || item.healthStatus === 'Injured' ? 'danger' : 'success'}>{item.isLocked || item.healthStatus === 'Injured' ? 'Chấn thương · Khóa tập' : 'Khỏe mạnh'}</Badge></button>)}
          </Card.Body></Card>
          <div className="d-flex align-items-center gap-2 mt-3"><Button onClick={() => setSent(true)}>➤ Gửi đăng ký</Button><Link to="/trainer" className="btn btn-outline-secondary">Quay lại Giải đua</Link><small className="text-muted">Giả định tạo hồ sơ và yêu cầu khám thú y; chưa phải đăng ký.</small></div>
        </Col>
        <Col xl={4}>
          <Card className="mb-3"><Card.Body><strong>Tóm tắt hồ sơ dự kiến</strong><Badge bg="light" text="dark" className="d-table mt-2">Bản nháp · Chưa gửi</Badge><div className="info-pair mt-3"><span>Người khởi tạo</span><strong>Trần Đức Hùng</strong></div><div className="info-pair"><span>Ngựa đã chọn</span><strong>{horse.name}</strong></div><div className="info-pair"><span>Chủ ngựa</span><strong>{horse.ownerName}</strong></div><div className="info-pair"><span>Giải đấu</span><strong>Giải đua Đại Việt 2026</strong></div><div className="info-pair"><span>Ngày thi đấu</span><strong>15/11/2026</strong></div></Card.Body></Card>
          <Card className="mb-3"><Card.Body><strong>Khi nào là “Đã đăng ký”?</strong><p className="small mt-2">Chỉ ghi nhận “Đã đăng ký” khi đủ 3 bước: HLV gửi, Bác sĩ xác nhận và Chủ đồng ý.</p><p className="small mb-0 text-danger">Bất kỳ từ chối nào cũng phải có lý do.</p></Card.Body></Card>
          <Alert variant="info"><strong>ⓘ Các bước tiếp theo đang chờ</strong><div className="small mt-1">Bác sĩ và chủ ngựa chưa có xử lý trong biểu mẫu này. Các trạng thái chỉ là thông tin, không thể thao tác.</div></Alert>
        </Col>
      </Row>
    </Container>
  );
};
