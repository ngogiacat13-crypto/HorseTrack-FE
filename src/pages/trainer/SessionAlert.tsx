import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const SessionAlert: React.FC = () => {
  const [action, setAction] = useState('pause');
  const [sent, setSent] = useState(false);

  return (
    <Container fluid>
      <div className="small text-muted mb-2"><Link to="/trainer" className="text-decoration-none">Lịch huấn luyện</Link>　›　03/10/2026　›　S-0023</div>
      <div className="mb-3"><h2 className="fw-bold mb-1">Phiên tập #S-0023 <Badge bg="danger">ĐÃ DỪNG — VƯỢT NGƯỠNG</Badge></h2><div className="text-muted small">Galaxy　·　03/10/2026 10:00　·　Mã phác đồ: Phạm Văn Toàn　·　Sức bền P2 · đường cát 1600 m</div></div>
      <Alert variant="danger" className="session-alert mb-3"><div className="fw-bold">⚠　CRITICAL · BR_01　　PHIÊN TẬP ĐÃ DỪNG — Vượt ngưỡng an toàn</div><div className="small mt-2">Nhịp tim <strong>195 bpm</strong> / ngưỡng 180　 ·　 Thời gian dừng <strong>10:23</strong>　 ·　 Dừng bởi <strong>Hệ thống</strong></div><hr /><small>Không thể tiếp tục phiên tập này. Cảnh báo đã gửi tới HLV trưởng và Mã phụ.</small></Alert>
      {sent && <Alert variant="success">Đã ghi nhận lựa chọn và gửi thông báo trong môi trường demo.</Alert>}
      <Row className="g-3">
        <Col xl={9}>
          <Card className="mb-3"><Card.Body>
            <div className="d-flex justify-content-between"><strong>Chỉ số tại thời điểm dừng</strong><span className="text-muted small">◉ Chỉ đọc</span></div>
            <Row className="g-3 mt-1 mb-3">
              <Col md={6}><div className="metric-box danger"><small>♡ Nhịp tim (bpm)</small><div className="fs-4 fw-bold">195 <span className="fs-6 text-muted">/ 180</span></div><div className="metric-track"><i style={{ width: '96%' }} /></div><small className="text-danger">108% ngưỡng</small></div></Col>
              <Col md={6}><div className="metric-box warning"><small>⌁ Tốc độ (km/h)</small><div className="fs-4 fw-bold">52 <span className="fs-6 text-muted">/ 60</span></div><div className="metric-track"><i style={{ width: '87%' }} /></div><small className="text-warning">87% ngưỡng</small></div></Col>
            </Row>
            <strong className="small">Diễn biến nhịp tim</strong>
            <div className="session-line-chart"><span>218</span><svg viewBox="0 0 600 150" role="img" aria-label="Biểu đồ nhịp tim tăng đến 195 bpm"><polyline points="0,125 90,105 180,86 270,68 360,58 450,40 540,20 600,0" fill="none" stroke="#e5484d" strokeWidth="3" />{['0,125','90,105','180,86','270,68','360,58','450,40','540,20','600,0'].map((point) => <circle key={point} cx={point.split(',')[0]} cy={point.split(',')[1]} r="4" fill="#e5484d" />)}</svg><div className="chart-time-labels"><span>10:00</span><span>10:04</span><span>10:08</span><span>10:12</span><span>10:16</span><span>10:20</span><span>10:23</span></div></div>
          </Card.Body></Card>
          <Card><Card.Body>
            <strong>Hành động tiếp theo</strong><p className="text-muted small mb-3">Chọn một hành động xử lý. Phiên tập sẽ không được tiếp tục.</p>
            <Row className="g-2 mb-3">
              <Col md={6}><button className={`action-choice ${action === 'pause' ? 'selected' : ''}`} onClick={() => setAction('pause')} type="button"><strong>☑　Gọi bác sĩ thú y</strong><small>Tạo ca khám mới trong hộp thư của Lê Thị Hương.</small></button></Col>
              <Col md={6}><button className={`action-choice ${action === 'plan' ? 'selected' : ''}`} onClick={() => setAction('plan')} type="button"><strong>□　Điều chỉnh kế hoạch huấn luyện</strong><small>Mở sửa bản P2 để giảm tải / đổi lịch.</small></button></Col>
            </Row>
            <Form.Label className="small fw-semibold">Ghi chú</Form.Label><Form.Control as="textarea" rows={2} placeholder="Nhập ghi chú về tình trạng ngựa..." />
            <div className="d-flex justify-content-between align-items-center mt-3"><small className="text-muted">ⓘ Không thể tiếp tục phiên tập đã dừng.</small><Button onClick={() => setSent(true)}>Xác nhận &amp; gửi ➤</Button></div>
          </Card.Body></Card>
        </Col>
        <Col xl={3}>
          <Card className="mb-3"><Card.Body><strong>Galaxy</strong><div className="small text-muted">Thoroughbred · 4 tuổi</div><hr /><div className="info-pair"><span>Chủ ngựa</span><strong>Hoàng Thị Lan</strong></div><div className="info-pair"><span>Kế hoạch</span><strong>Sức bền · P2</strong></div><div className="info-pair"><span>Phiên trước</span><strong>Max 172 bpm</strong></div></Card.Body></Card>
          <Card className="mb-3"><Card.Body><strong>Cảnh báo đã gửi</strong><p className="small mt-3 mb-1">🔔 Trần Đức Hùng <Badge bg="success">Đã xem</Badge></p><p className="small mb-0">Phạm Văn Toàn <span className="text-muted">10:23</span></p></Card.Body></Card>
          <Alert variant="warning"><strong className="small">ⓘ Ngưỡng an toàn · DEMO ONLY</strong><div className="small mt-1">Giới hạn 180 bpm / 60 km/h chỉ để tham chiếu. Quyết định chăm sóc cần được xác nhận bởi bác sĩ thú y.</div></Alert>
        </Col>
      </Row>
    </Container>
  );
};
