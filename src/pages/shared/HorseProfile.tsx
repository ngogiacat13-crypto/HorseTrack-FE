import React from 'react';
import { Badge, Button, Card, Col, Container, Nav, Row, Tab } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { MOCK_HORSES } from '../../api/mockData';

export const HorseProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const horse = MOCK_HORSES.find((item) => item.id === id);
  const name = horse?.name ?? 'Storm';

  return (
    <Container fluid>
      <div className="small text-muted mb-2"><Link to="/trainer" className="text-decoration-none">‹　Quay lại</Link>　|　Sức khỏe đàn ngựa　›　{name}</div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3"><div className="horse-photo">🐴</div><div><h2 className="fw-bold mb-1">{name} <Badge bg="danger">● Chấn thương</Badge> <Badge bg="danger">🔒 KHÓA TẬP</Badge></h2><small className="text-muted">{horse?.id.toUpperCase() ?? 'VN-MC-0842'}　·　{horse?.breed ?? 'Arabian'} · {horse?.age ?? '3 tuổi'}　Chuồng A-03　Chủ: {horse?.ownerName ?? 'Đỗ Minh Quân'}</small></div></div>
        <div className="d-flex gap-2"><Button variant="outline-secondary" size="sm">▤　Ghi hồ sơ khám</Button><Button size="sm">♧　Tạo phác đồ</Button></div>
      </div>
      <div className="alert alert-danger py-2 small"><strong>♧　Ngựa đang bị khóa tập từ 28/09/2026</strong> bởi BS. Lê Thị Hương — lý do: chấn thương chân trước trái. Mọi lịch huấn luyện bị chặn và bác sĩ thú y được chỉnh khẩu phần.</div>
      <Tab.Container defaultActiveKey="health">
        <Nav variant="tabs" className="profile-tabs mb-3"><Nav.Item><Nav.Link eventKey="overview">Tổng quan</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="pedigree">Phả hệ</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="health">Sức khỏe</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="training">Huấn luyện</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="race">Đua</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="documents">Tài liệu</Nav.Link></Nav.Item></Nav>
        <Tab.Content>
          <Tab.Pane eventKey="health"><Row className="g-3">
            <Col xl={8}>
              <Card className="horse-map-card"><Card.Body><strong>Bản đồ chấn thương 2D</strong><div className="horse-map"><div className="horse-map-tools"><Button size="sm" variant="outline-secondary">Chân sau ⌄</Button><Button size="sm" variant="outline-secondary">Mức độ ⌄</Button><Button size="sm">＋ Thêm</Button></div><img src="/horse-anatomy.svg" alt="Sơ đồ giải phẫu ngựa, nhìn từ bên trái" /><button type="button" className="injury-marker" aria-label="Chấn thương chân trước trái">●</button><div className="injury-card"><strong>Chân trước trái</strong><small>Sưng gân gấp, đau khi chạm. Ghi 28/09</small></div><div className="horse-map-legend"><span>BỘ PHẬN</span><span>MỨC ĐỘ</span><span>NGÀY GHI</span><span>BÁC SĨ</span><span>GHI CHÚ</span></div></div><div className="injury-row"><span><i className="dot danger-dot" />Chân trước trái</span><span>Nặng</span><span>28/09/2026</span><span>Lê Thị Hương</span><span>Sưng gân gấp</span></div><div className="injury-row"><span><i className="dot warning-dot" />Vai phải</span><span>Nhẹ</span><span>27/09/2026</span><span>Lê Thị Hương</span><span>Trầy xước nhẹ</span></div></Card.Body></Card>
            </Col>
            <Col xl={4}>
              <Card className="mb-3"><Card.Body><strong>Trạng thái hiện tại</strong>{[['Sức khỏe', 'Chấn thương'], ['Huấn luyện', 'KHÓA TẬP'], ['Lý do', 'Chấn thương chân trước trái'], ['Khóa bởi', 'Lê Thị Hương'], ['Ngày khóa', '28/09/2026'], ['Hợp đồng', 'Hoạt động']].map(([label, value]) => <div className="info-pair mt-2" key={label}><span>{label}</span><strong className={label === 'Sức khỏe' || label === 'Huấn luyện' ? 'text-danger' : ''}>{value}</strong></div>)}</Card.Body></Card>
              <Card className="mb-3"><Card.Body><strong>Phác đồ đang áp dụng</strong><small className="float-end text-muted">PP-0011</small><div className="info-pair mt-3"><span>GĐ 1 · 08/10</span><Badge bg="primary">Chờ duyệt</Badge></div><div className="info-pair mt-2"><span>GĐ 2 · 19/10</span><Badge bg="secondary">Chưa bắt đầu</Badge></div></Card.Body></Card>
              <Card><Card.Body><strong>Lịch sử y tế</strong><div className="medical-timeline">{[['28/09/2026', 'Khóa huấn luyện'], ['27/09/2026', 'Khám chấn thương · #C-0012'], ['28/08/2026', 'Tiêm phòng cảm cúm'], ['15/09/2026', 'Tẩy giun định kỳ'], ['01/09/2026', 'Khám định kỳ']].map(([date, title], i) => <div key={title}><i className={i < 2 ? 'danger-dot' : 'success-dot'} /><small>{date}</small><strong>{title}</strong></div>)}</div></Card.Body></Card>
            </Col>
          </Row></Tab.Pane>
          <Tab.Pane eventKey="overview"><Card><Card.Body><h5>{name}</h5><p>{horse?.breed} · {horse?.age} · {horse?.gender}</p><p>Chủ sở hữu: {horse?.ownerName ?? '—'}</p><p>Kế hoạch: {horse?.trainerPlan ?? '—'}</p></Card.Body></Card></Tab.Pane>
          {['pedigree', 'training', 'race', 'documents'].map((key) => <Tab.Pane eventKey={key} key={key}><Card><Card.Body className="text-muted">Thông tin {key === 'pedigree' ? 'phả hệ' : key === 'training' ? 'huấn luyện' : key === 'race' ? 'thi đấu' : 'tài liệu'} sẽ hiển thị tại đây.</Card.Body></Card></Tab.Pane>)}
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};
